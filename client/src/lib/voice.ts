export interface VoiceCommandResult {
  intent: string;
  response: string;
  action?: string;
  data?: any;
}

export class VoiceService {
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis;
  private isListening: boolean = false;
  private currentLanguage: string = 'en-US';

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
  }

  setLanguage(language: string) {
    const languageMap: { [key: string]: string } = {
      'en': 'en-US',
      'hi': 'hi-IN', 
      'te': 'te-IN',
      'ta': 'ta-IN',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'mr': 'mr-IN',
      'pa': 'pa-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'or': 'or-IN'
    };

    this.currentLanguage = languageMap[language] || 'en-US';
    
    if (this.recognition) {
      this.recognition.lang = this.currentLanguage;
    }
  }

  async startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      this.recognition.lang = this.currentLanguage;
      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.isListening = false;
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text: string, language?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language for synthesis
      const synthLanguage = language || this.currentLanguage;
      utterance.lang = synthLanguage;
      
      // Find appropriate voice
      const voices = this.synthesis.getVoices();
      const voice = voices.find(v => v.lang === synthLanguage) || 
                   voices.find(v => v.lang.startsWith(synthLanguage.split('-')[0]));
      
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  isSupported(): boolean {
    return !!(
      this.synthesis && 
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  async processCommand(command: string): Promise<VoiceCommandResult> {
    try {
      const response = await fetch('/api/voice/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('fms_token')}`
        },
        body: JSON.stringify({ command })
      });

      if (!response.ok) {
        throw new Error('Failed to process voice command');
      }

      return await response.json();
    } catch (error) {
      console.error('Voice command processing failed:', error);
      return {
        intent: 'error',
        response: 'Sorry, I could not process your command. Please try again.'
      };
    }
  }
}

export const voiceService = new VoiceService();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
