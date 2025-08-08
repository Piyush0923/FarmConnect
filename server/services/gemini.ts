import { GoogleGenAI } from "@google/genai";
import type { Farmer, Scheme, FarmerWithProfile, SchemeWithEligibility } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "" 
});

export interface SchemeRecommendation {
  schemeId: string;
  matchPercentage: number;
  reasoning: string;
  benefits: string[];
  nextSteps: string[];
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export class GeminiService {
  async analyzeSchemeEligibility(
    farmer: FarmerWithProfile, 
    schemes: Scheme[]
  ): Promise<SchemeRecommendation[]> {
    try {
      const farmerProfile = {
        state: farmer.state,
        district: farmer.district,
        age: farmer.age,
        category: farmer.category,
        totalLandArea: farmer.lands.reduce((sum, land) => sum + parseFloat(land.area || '0'), 0),
        crops: farmer.crops.map(crop => ({
          name: crop.cropName,
          area: crop.area,
          season: crop.season
        })),
        livestock: farmer.livestock.map(animal => ({
          type: animal.animalType,
          count: animal.count
        }))
      };

      const systemPrompt = `You are an expert agricultural advisor for Indian government schemes. 
Analyze farmer profiles and recommend suitable government schemes with match percentages.
Consider eligibility criteria like location, land size, crop types, age, category, and livestock.
Provide practical next steps for application.`;

      const userPrompt = `Farmer Profile: ${JSON.stringify(farmerProfile)}
Available Schemes: ${JSON.stringify(schemes.map(s => ({
  id: s.id,
  name: s.name,
  description: s.description,
  eligibilityCriteria: s.eligibilityCriteria,
  targetStates: s.targetStates,
  targetCrops: s.targetCrops,
  landSizeMin: s.landSizeMin,
  landSizeMax: s.landSizeMax,
  ageMin: s.ageMin,
  ageMax: s.ageMax,
  applicableCategories: s.applicableCategories,
  benefitAmount: s.benefitAmount
})))}

Analyze and provide recommendations in JSON format with match percentages (0-100), reasoning, benefits, and next steps for each eligible scheme.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    schemeId: { type: "string" },
                    matchPercentage: { type: "number" },
                    reasoning: { type: "string" },
                    benefits: { 
                      type: "array",
                      items: { type: "string" }
                    },
                    nextSteps: {
                      type: "array", 
                      items: { type: "string" }
                    }
                  },
                  required: ["schemeId", "matchPercentage", "reasoning", "benefits", "nextSteps"]
                }
              }
            },
            required: ["recommendations"]
          }
        },
        contents: userPrompt,
      });

      const result = JSON.parse(response.text || '{}');
      return result.recommendations || [];

    } catch (error) {
      console.error("Failed to analyze scheme eligibility:", error);
      return [];
    }
  }

  async translateContent(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const systemPrompt = `You are a professional translator specializing in Indian languages and agricultural terminology.
Translate the given text accurately while preserving technical agricultural terms and government scheme information.
Provide natural, contextual translations that are easily understood by Indian farmers.`;

      const userPrompt = `Translate the following text to ${this.getLanguageName(request.targetLanguage)}:
"${request.text}"

Respond in JSON format with the translated text.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              translatedText: { type: "string" },
              sourceLanguage: { type: "string" },
              targetLanguage: { type: "string" }
            },
            required: ["translatedText", "sourceLanguage", "targetLanguage"]
          }
        },
        contents: userPrompt,
      });

      const result = JSON.parse(response.text || '{}');
      return result;

    } catch (error) {
      console.error("Translation failed:", error);
      return {
        translatedText: request.text,
        sourceLanguage: "unknown",
        targetLanguage: request.targetLanguage
      };
    }
  }

  async generateFarmingTips(farmer: FarmerWithProfile): Promise<string[]> {
    try {
      const farmerContext = {
        location: `${farmer.district}, ${farmer.state}`,
        crops: farmer.crops.map(c => c.cropName),
        landArea: farmer.lands.reduce((sum, land) => sum + parseFloat(land.area || '0'), 0),
        season: farmer.crops[0]?.season || 'kharif'
      };

      const systemPrompt = `You are an experienced agricultural extension officer in India.
Provide practical, season-appropriate farming tips based on the farmer's profile.
Focus on local best practices, sustainable farming, and productivity improvement.`;

      const userPrompt = `Farmer Profile: ${JSON.stringify(farmerContext)}
Provide 5-7 practical farming tips relevant to this farmer's situation, crops, and location.
Focus on current season recommendations, pest management, soil health, and yield optimization.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              tips: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["tips"]
          }
        },
        contents: userPrompt,
      });

      const result = JSON.parse(response.text || '{}');
      return result.tips || [];

    } catch (error) {
      console.error("Failed to generate farming tips:", error);
      return [
        "Ensure proper irrigation management based on crop requirements",
        "Monitor soil moisture levels regularly",
        "Apply organic compost to improve soil health",
        "Check for pest and disease symptoms weekly"
      ];
    }
  }

  async processVoiceCommand(command: string, farmer: FarmerWithProfile): Promise<{
    intent: string;
    response: string;
    action?: string;
    data?: any;
  }> {
    try {
      const systemPrompt = `You are a voice assistant for Indian farmers using the Farmer Management System.
Understand voice commands in multiple Indian languages and English.
Determine the farmer's intent and provide appropriate responses with actionable data.

Common intents:
- weather: Get weather information
- schemes: Show government schemes
- prices: Market prices
- profile: View/update profile
- crops: Crop information
- applications: Check application status
- help: Get assistance

Respond with intent classification and appropriate response.`;

      const userPrompt = `Voice Command: "${command}"
Farmer Profile: ${JSON.stringify({
        name: farmer.name,
        location: `${farmer.district}, ${farmer.state}`,
        crops: farmer.crops.map(c => c.cropName)
      })}

Analyze the command and respond with intent, response message, and any required action/data.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              intent: { type: "string" },
              response: { type: "string" },
              action: { type: "string" },
              data: { type: "object" }
            },
            required: ["intent", "response"]
          }
        },
        contents: userPrompt,
      });

      return JSON.parse(response.text || '{}');

    } catch (error) {
      console.error("Voice command processing failed:", error);
      return {
        intent: "unknown",
        response: "मैं समझ नहीं पाया। कृपया दोबारा कोशिश करें। (I didn't understand. Please try again.)"
      };
    }
  }

  private getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      'hi': 'Hindi (हिंदी)',
      'te': 'Telugu (తెలుగు)',
      'ta': 'Tamil (தமிழ்)',
      'bn': 'Bengali (বাংলা)',
      'gu': 'Gujarati (ગુજરાતી)',
      'mr': 'Marathi (मराठी)',
      'pa': 'Punjabi (ਪੰਜਾਬੀ)',
      'kn': 'Kannada (ಕನ್ನಡ)',
      'ml': 'Malayalam (മലയാളം)',
      'or': 'Odia (ଓଡ଼ିଆ)',
      'en': 'English'
    };
    return languages[code] || 'English';
  }
}

export const geminiService = new GeminiService();
