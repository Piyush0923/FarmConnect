import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Leaf, Wifi, WifiOff, Mic, User, ChevronDown, LogOut, Settings, Moon, Sun } from "lucide-react";
import { voiceService } from "@/lib/voice";
import VoiceAssistant from "@/components/voice-assistant";

export default function Header() {
  const { user, logout } = useAuth();
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [, setLocation] = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fms_theme') === 'dark' || 
             (!localStorage.getItem('fms_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fms_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fms_theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const toggleVoiceAssistant = () => {
    setShowVoiceAssistant(!showVoiceAssistant);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b-2 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2" data-testid="logo">
              <Leaf className="text-primary text-2xl" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">FMS</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-hindi">किसान प्रबंधन प्रणाली</p>
              </div>
            </div>
            
            {/* Online/Offline Status */}
            <Badge 
              variant={isOnline ? "default" : "destructive"} 
              className={`${isOnline ? 'bg-success hover:bg-success/90' : ''} text-white px-3 py-1 rounded-full text-sm hidden sm:flex items-center space-x-2`}
              data-testid="connection-status"
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32" data-testid="language-selector">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Dark Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDarkMode}
              className="p-2 rounded-full transition-colors"
              data-testid="dark-mode-toggle"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            {/* Voice Assistant Toggle */}
            {voiceService.isSupported() && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleVoiceAssistant}
                className={`p-2 rounded-full transition-colors ${
                  showVoiceAssistant 
                    ? 'bg-secondary text-white hover:bg-secondary/90' 
                    : 'bg-secondary text-white hover:bg-secondary/90'
                }`}
                data-testid="voice-assistant-toggle"
              >
                <Mic className="w-4 h-4" />
              </Button>
            )}
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2 bg-primary text-white hover:bg-primary/90"
                  data-testid="user-menu-trigger"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.username}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocation('/profile')} data-testid="profile-menu-item">
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} data-testid="logout-menu-item">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Voice Assistant Component */}
      {showVoiceAssistant && (
        <VoiceAssistant
          isOpen={showVoiceAssistant}
          onClose={() => setShowVoiceAssistant(false)}
        />
      )}
    </header>
  );
}
