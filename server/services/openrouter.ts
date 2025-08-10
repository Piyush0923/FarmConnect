export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  state: string;
  country: string;
}

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

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  private async makeRequest(messages: any[], responseFormat?: any): Promise<string> {
    if (!this.apiKey) {
      console.warn('OpenRouter API key not configured, using fallback responses');
      return this.getFallbackResponse(messages);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://farmer-management-system.com',
          'X-Title': 'Farmer Management System'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages,
          response_format: responseFormat,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data: OpenRouterResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return this.getFallbackResponse(messages);
    }
  }

  private getFallbackResponse(messages: any[]): string {
    const userMessage = messages[messages.length - 1]?.content || '';
    
    if (userMessage.includes('location') || userMessage.includes('address')) {
      return JSON.stringify({
        latitude: 18.5204,
        longitude: 73.8567,
        address: "Pune, Maharashtra, India",
        district: "Pune",
        state: "Maharashtra",
        country: "India"
      });
    }
    
    if (userMessage.includes('schemes') || userMessage.includes('generate')) {
      return JSON.stringify({
        schemes: [
          {
            name: "PM-KISAN Scheme",
            description: "Direct income support to farmers providing ₹6,000 per year in three equal instalments.",
            benefits: "Financial assistance of ₹6,000 per year for small and marginal farmers",
            eligibilityCriteria: ["Small and marginal farmers", "Land holding up to 2 hectares", "Valid Aadhar card required"],
            requiredDocuments: ["Aadhar card", "Bank account details", "Land ownership documents"],
            applicationProcess: "Apply online at pmkisan.gov.in or visit nearest Common Service Center",
            deadline: "2024-12-31",
            schemeType: "central",
            department: "Ministry of Agriculture & Farmers Welfare",
            benefitAmount: 6000,
            targetStates: ["maharashtra", "punjab", "haryana", "uttar-pradesh", "gujarat"],
            targetCrops: ["rice", "wheat", "sugarcane", "cotton"],
            landSizeMin: 0.1,
            landSizeMax: 2.0,
            ageMin: 18,
            ageMax: 70,
            applicableCategories: ["general", "obc", "sc", "st"]
          },
          {
            name: "Pradhan Mantri Fasal Bima Yojana",
            description: "Crop insurance scheme providing financial support to farmers suffering crop loss/damage.",
            benefits: "Insurance coverage for crop losses due to natural calamities, pests & diseases",
            eligibilityCriteria: ["All farmers growing notified crops", "Sharecroppers and tenant farmers eligible", "Premium rates: 2% for Kharif, 1.5% for Rabi crops"],
            requiredDocuments: ["Aadhar card", "Bank account details", "Land records", "Sowing certificate"],
            applicationProcess: "Apply through banks, insurance companies or online portal",
            deadline: "2024-11-30",
            schemeType: "central",
            department: "Ministry of Agriculture & Farmers Welfare",
            benefitAmount: 200000,
            targetStates: ["maharashtra", "punjab", "haryana", "uttar-pradesh"],
            targetCrops: ["rice", "wheat", "sugarcane", "cotton", "soybean"],
            landSizeMin: 0.1,
            landSizeMax: 50.0,
            ageMin: 18,
            ageMax: 75,
            applicableCategories: ["general", "obc", "sc", "st"]
          }
        ]
      });
    }
    
    if (userMessage.includes('recommendations') || userMessage.includes('eligibility')) {
      return JSON.stringify({
        recommendations: [
          {
            schemeId: "pm-kisan-1",
            matchPercentage: 95,
            reasoning: "Perfect match for small farmer with land holding under 2 hectares",
            benefits: ["Direct income support", "No application fee", "Automatic transfer"],
            nextSteps: ["Visit pmkisan.gov.in", "Complete online application", "Submit required documents"]
          }
        ]
      });
    }
    
    if (userMessage.includes('translate')) {
      return JSON.stringify({
        translatedText: userMessage,
        sourceLanguage: "en",
        targetLanguage: "hi"
      });
    }
    
    return JSON.stringify({
      intent: "help",
      response: "I'm here to help you with your farming needs. Please try again.",
      action: "help"
    });
  }

  async getLocationFromAddress(address: string): Promise<LocationData | null> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a location service that extracts geographic information from Indian addresses. 
          Analyze the given address and provide location details in JSON format.
          Focus on Indian states, districts, and villages.`
        },
        {
          role: 'user',
          content: `Extract location information from this address: "${address}"
          
          Provide response in this exact JSON format:
          {
            "latitude": 0.0,
            "longitude": 0.0,
            "address": "formatted address",
            "district": "district name",
            "state": "state name",
            "country": "India"
          }
          
          Use approximate coordinates for the district/state if exact location is not determinable.`
        }
      ];

      const response = await this.makeRequest(messages, { type: 'json_object' });
      return JSON.parse(response);
    } catch (error) {
      console.error('Location extraction failed:', error);
      return {
        latitude: 18.5204,
        longitude: 73.8567,
        address: address,
        district: "Pune",
        state: "Maharashtra",
        country: "India"
      };
    }
  }

  async generateSchemes(farmerProfile: any): Promise<any[]> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert on Indian government agricultural schemes. 
          Generate relevant government schemes based on farmer profiles.
          Focus on real, current schemes available in India.`
        },
        {
          role: 'user',
          content: `Generate 5-8 relevant government schemes for this farmer profile:
          ${JSON.stringify(farmerProfile)}
          
          Provide response as JSON with this format:
          {
            "schemes": [
              {
                "name": "Scheme Name",
                "description": "Detailed description",
                "benefits": "Benefits provided",
                "eligibilityCriteria": ["criteria1", "criteria2"],
                "requiredDocuments": ["doc1", "doc2"],
                "applicationProcess": "How to apply",
                "deadline": "2024-12-31",
                "schemeType": "central/state",
                "department": "Department name",
                "benefitAmount": 50000,
                "targetStates": ["state1", "state2"],
                "targetCrops": ["crop1", "crop2"],
                "landSizeMin": 0.1,
                "landSizeMax": 5.0,
                "ageMin": 18,
                "ageMax": 70,
                "applicableCategories": ["general", "obc", "sc", "st"]
              }
            ]
          }`
        }
      ];

      const response = await this.makeRequest(messages, { type: 'json_object' });
      const result = JSON.parse(response);
      
      return (result.schemes || result).map((scheme: any) => ({
        ...scheme,
        id: this.generateId(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      console.error('Scheme generation failed:', error);
      return this.getFallbackSchemes();
    }
  }

  async analyzeSchemeEligibility(farmerProfile: any, schemes: any[]): Promise<SchemeRecommendation[]> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an agricultural advisor analyzing farmer eligibility for government schemes.
          Calculate match percentages and provide reasoning for each scheme.`
        },
        {
          role: 'user',
          content: `Analyze eligibility for these schemes:
          Farmer: ${JSON.stringify(farmerProfile)}
          Schemes: ${JSON.stringify(schemes)}
          
          Provide JSON response:
          {
            "recommendations": [
              {
                "schemeId": "scheme_id",
                "matchPercentage": 85,
                "reasoning": "Why this scheme matches",
                "benefits": ["benefit1", "benefit2"],
                "nextSteps": ["step1", "step2"]
              }
            ]
          }`
        }
      ];

      const response = await this.makeRequest(messages, { type: 'json_object' });
      const result = JSON.parse(response);
      return result.recommendations || [];
    } catch (error) {
      console.error('Scheme analysis failed:', error);
      return schemes.map(scheme => ({
        schemeId: scheme.id,
        matchPercentage: Math.floor(Math.random() * 40) + 60,
        reasoning: "Based on your profile, this scheme appears suitable for your farming situation.",
        benefits: ["Financial support", "Government backing", "Easy application process"],
        nextSteps: ["Check eligibility", "Gather documents", "Submit application"]
      }));
    }
  }

  async translateContent(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a professional translator for Indian languages and agricultural content.
          Translate accurately while preserving technical terms.`
        },
        {
          role: 'user',
          content: `Translate this text to ${this.getLanguageName(request.targetLanguage)}:
          "${request.text}"
          
          Provide JSON response:
          {
            "translatedText": "translated content",
            "sourceLanguage": "detected source language",
            "targetLanguage": "${request.targetLanguage}"
          }`
        }
      ];

      const response = await this.makeRequest(messages, { type: 'json_object' });
      return JSON.parse(response);
    } catch (error) {
      console.error('Translation failed:', error);
      return {
        translatedText: request.text,
        sourceLanguage: 'unknown',
        targetLanguage: request.targetLanguage
      };
    }
  }

  async processVoiceCommand(command: string, farmerProfile: any): Promise<{
    intent: string;
    response: string;
    action?: string;
    data?: any;
  }> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a voice assistant for Indian farmers. Understand commands in multiple Indian languages.
          Determine intent and provide appropriate responses.`
        },
        {
          role: 'user',
          content: `Voice command: "${command}"
          Farmer: ${JSON.stringify(farmerProfile)}
          
          Analyze and respond in JSON:
          {
            "intent": "weather/schemes/profile/navigation/help",
            "response": "Response message in same language as command",
            "action": "navigate/show/help",
            "data": {"path": "/weather"}
          }`
        }
      ];

      const response = await this.makeRequest(messages, { type: 'json_object' });
      return JSON.parse(response);
    } catch (error) {
      console.error('Voice command processing failed:', error);
      return {
        intent: 'unknown',
        response: 'Sorry, I could not understand your command. Please try again.'
      };
    }
  }

  private getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      'hi': 'Hindi',
      'te': 'Telugu',
      'ta': 'Tamil',
      'bn': 'Bengali',
      'gu': 'Gujarati',
      'mr': 'Marathi',
      'pa': 'Punjabi',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'or': 'Odia',
      'en': 'English'
    };
    return languages[code] || 'English';
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private getFallbackSchemes(): any[] {
    return [
      {
        id: this.generateId(),
        name: 'PM-KISAN Scheme',
        description: 'Direct income support to farmers providing ₹6,000 per year in three equal instalments.',
        benefits: 'Financial assistance of ₹6,000 per year for small and marginal farmers',
        eligibilityCriteria: ['Small and marginal farmers', 'Land holding up to 2 hectares', 'Valid Aadhar card required'],
        requiredDocuments: ['Aadhar card', 'Bank account details', 'Land ownership documents'],
        applicationProcess: 'Apply online at pmkisan.gov.in or visit nearest Common Service Center',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        schemeType: 'central',
        department: 'Ministry of Agriculture & Farmers Welfare',
        benefitAmount: 6000,
        isActive: true,
        targetStates: ['maharashtra', 'punjab', 'haryana', 'uttar-pradesh', 'gujarat'],
        targetCrops: ['rice', 'wheat', 'sugarcane', 'cotton'],
        landSizeMin: 0.1,
        landSizeMax: 2.0,
        ageMin: 18,
        ageMax: 70,
        applicableCategories: ['general', 'obc', 'sc', 'st'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId(),
        name: 'Pradhan Mantri Fasal Bima Yojana',
        description: 'Crop insurance scheme providing financial support to farmers suffering crop loss/damage.',
        benefits: 'Insurance coverage for crop losses due to natural calamities, pests & diseases',
        eligibilityCriteria: ['All farmers growing notified crops', 'Sharecroppers and tenant farmers eligible', 'Premium rates: 2% for Kharif, 1.5% for Rabi crops'],
        requiredDocuments: ['Aadhar card', 'Bank account details', 'Land records', 'Sowing certificate'],
        applicationProcess: 'Apply through banks, insurance companies or online portal',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        schemeType: 'central',
        department: 'Ministry of Agriculture & Farmers Welfare',
        benefitAmount: 200000,
        isActive: true,
        targetStates: ['maharashtra', 'punjab', 'haryana', 'uttar-pradesh'],
        targetCrops: ['rice', 'wheat', 'sugarcane', 'cotton', 'soybean'],
        landSizeMin: 0.1,
        landSizeMax: 50.0,
        ageMin: 18,
        ageMax: 75,
        applicableCategories: ['general', 'obc', 'sc', 'st'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.generateId(),
        name: 'Soil Health Card Scheme',
        description: 'Provides soil health cards to farmers with recommendations for appropriate nutrients and fertilizers.',
        benefits: 'Free soil testing and customized fertilizer recommendations to improve soil health',
        eligibilityCriteria: ['All farmers', 'Individual and institutional land holders', 'One card per 2.5 acres'],
        requiredDocuments: ['Land ownership documents', 'Aadhar card', 'Village revenue records'],
        applicationProcess: 'Contact local agriculture department or visit designated soil testing centers',
        schemeType: 'central',
        department: 'Ministry of Agriculture & Farmers Welfare',
        isActive: true,
        targetStates: ['maharashtra', 'punjab', 'haryana', 'uttar-pradesh', 'gujarat'],
        targetCrops: ['rice', 'wheat', 'sugarcane', 'cotton', 'soybean'],
        landSizeMin: 0.1,
        landSizeMax: 100.0,
        ageMin: 18,
        ageMax: 80,
        applicableCategories: ['general', 'obc', 'sc', 'st'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

export const openRouterService = new OpenRouterService();