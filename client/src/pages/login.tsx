import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, user, loading } = useAuth();
  const { language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      const success = await login(data);
      if (success) {
        setLocation("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4" data-testid="login-header">
            <Leaf className="text-primary text-4xl" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FMS</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-hindi">किसान प्रबंधन प्रणाली</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'hi' ? 'अपने खाते में लॉग इन करें' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {language === 'hi' 
              ? 'सरकारी योजनाओं और लाभों तक पहुंच प्राप्त करें' 
              : 'Access government schemes and benefits'}
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your farmer profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="login-form">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your username" 
                          {...field}
                          data-testid="input-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          {...field}
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={isSubmitting}
                  data-testid="button-login"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Button 
                  variant="link" 
                  onClick={() => setLocation('/register')}
                  className="text-primary hover:text-primary/90 p-0 h-auto"
                  data-testid="link-register"
                >
                  Register here
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">Demo Credentials:</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Username: farmer1 | Password: password123
          </p>
        </div>
      </div>
    </div>
  );
}
