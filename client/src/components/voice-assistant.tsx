import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { voiceService, type VoiceCommandResult } from "@/lib/voice";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceAssistant({ isOpen, onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [commandHistory, setCommandHistory] = useState<VoiceCommandResult[]>([]);
  
  const { language } = useLanguage();
  const { toast } = useToast();

  // Set voice service language when language changes
  useEffect(() => {
    voiceService.setLanguage(language);
  }, [language]);

  // Example voice commands based on current language
  const getExampleCommands = () => {
    const commands = {
      'en': [
        '"Show my schemes"',
        '"Check weather"',
        '"Market prices"',
        '"Update profile"'
      ],
      'hi': [
        '"मेरे स्कीम दिखाओ"',
        '"मौसम देखो"',
        '"बाजार भाव"',
        '"प्रोफाइल अपडेट करो"'
      ],
      'te': [
        '"నా పథకాలు చూపించు"',
        '"వాతావరణం చూపించు"',
        '"మార్కెట్ ధరలు"',
        '"ప్రొఫైల్ అప్డేట్ చేయి"'
      ]
    };
    
    return commands[language as keyof typeof commands] || commands.en;
  };

  const startListening = async () => {
    if (!voiceService.isSupported()) {
      toast({
        title: "Voice Not Supported",
        description: "Voice recognition is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsListening(true);
      setTranscript("");
      setResponse("");
      
      const command = await voiceService.startListening();
      setTranscript(command);
      
      await processVoiceCommand(command);
      
    } catch (error: any) {
      console.error("Voice listening error:", error);
      toast({
        title: "Voice Recognition Failed",
        description: error.message || "Failed to recognize speech",
        variant: "destructive"
      });
    } finally {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
  };

  const processVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      const result = await voiceService.processCommand(command);
      setResponse(result.response);
      
      // Add to command history
      setCommandHistory(prev => [result, ...prev.slice(0, 4)]);
      
      // Speak the response
      await speakResponse(result.response);
      
      // Handle actions if any
      if (result.action) {
        handleVoiceAction(result);
      }
      
    } catch (error: any) {
      console.error("Command processing error:", error);
      const errorResponse = "Sorry, I couldn't process your command. Please try again.";
      setResponse(errorResponse);
      await speakResponse(errorResponse);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      setIsSpeaking(true);
      await voiceService.speak(text, language);
    } catch (error) {
      console.error("Speech synthesis error:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  const handleVoiceAction = (result: VoiceCommandResult) => {
    // Handle different voice actions
    switch (result.intent) {
      case 'navigate':
        if (result.data?.path) {
          // Navigation would be handled by parent component
          onClose();
        }
        break;
      case 'weather':
        // Weather data would be displayed
        break;
      case 'schemes':
        // Scheme navigation
        onClose();
        break;
      default:
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="voice-assistant-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mic className="w-5 h-5 text-secondary" />
            <span>Voice Assistant</span>
            {isListening && <Badge variant="secondary" className="animate-pulse">Listening...</Badge>}
            {isProcessing && <Badge variant="outline">Processing...</Badge>}
            {isSpeaking && <Badge className="bg-success">Speaking...</Badge>}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Voice Control Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`p-4 rounded-full ${
                isListening 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'bg-secondary hover:bg-secondary/90'
              } text-white`}
              data-testid={isListening ? "stop-listening-button" : "start-listening-button"}
            >
              {isListening ? (
                <MicOff className="w-6 h-6" />
              ) : isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
            
            <Button
              onClick={isSpeaking ? stopSpeaking : undefined}
              disabled={!isSpeaking}
              variant="outline"
              className="p-4 rounded-full"
              data-testid="speaker-control-button"
            >
              {isSpeaking ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </Button>
          </div>

          {/* Current Interaction */}
          {transcript && (
            <div className="bg-muted p-3 rounded-lg" data-testid="voice-transcript">
              <p className="text-sm font-medium text-muted-foreground mb-1">You said:</p>
              <p className="text-sm">{transcript}</p>
            </div>
          )}

          {response && (
            <div className="bg-accent/10 p-3 rounded-lg" data-testid="voice-response">
              <p className="text-sm font-medium text-accent mb-1">Assistant:</p>
              <p className="text-sm">{response}</p>
            </div>
          )}

          {/* Example Commands */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Try saying:</p>
            <div className="space-y-1">
              {getExampleCommands().map((command, index) => (
                <p key={index} className="text-xs text-muted-foreground font-mono">
                  {command}
                </p>
              ))}
            </div>
          </div>

          {/* Command History */}
          {commandHistory.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground">Recent commands:</p>
              {commandHistory.map((cmd, index) => (
                <div key={index} className="bg-muted/50 p-2 rounded text-xs">
                  <p className="font-medium">{cmd.intent}</p>
                  <p className="text-muted-foreground truncate">{cmd.response}</p>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="w-full"
              data-testid="close-voice-assistant"
            >
              Close Assistant
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
