import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  register: (userData: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = localStorage.getItem('fms_token');
    const savedUser = localStorage.getItem('fms_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      const data = await response.json();
      
      setUser(data.user);
      setToken(data.token);
      
      localStorage.setItem('fms_token', data.token);
      localStorage.setItem('fms_user', JSON.stringify(data.user));
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.username}!`,
        variant: "default",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Login Failed", 
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (userData: { username: string; password: string }): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const data = await response.json();
      
      setUser(data.user);
      setToken(data.token);
      
      localStorage.setItem('fms_token', data.token);
      localStorage.setItem('fms_user', JSON.stringify(data.user));
      
      toast({
        title: "Registration Successful",
        description: "Welcome to FMS! Please complete your farmer profile.",
        variant: "default",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fms_token');
    localStorage.removeItem('fms_user');
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      variant: "default",
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
