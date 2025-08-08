import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  // Farmer details
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().optional(),
  age: z.number().min(18, "Age must be at least 18").max(100, "Age must be less than 100"),
  gender: z.enum(["male", "female", "other"]),
  category: z.enum(["general", "obc", "sc", "st"]),
  mobileNumber: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar number must be 12 digits").optional(),
  address: z.string().min(10, "Address must be at least 10 characters"),
  village: z.string().min(2, "Village name is required"),
  district: z.string().min(2, "District name is required"),
  state: z.string().min(2, "State name is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  language: z.string().default("en"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { register: registerUser, user, loading } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Account details, 2: Personal details

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      fatherName: "",
      age: 25,
      gender: "male",
      category: "general",
      mobileNumber: "",
      aadharNumber: "",
      address: "",
      village: "",
      district: "",
      state: "",
      pincode: "",
      language: language,
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      setLocation("/profile");
    }
  }, [user, loading, setLocation]);

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      // First create user account
      const success = await registerUser({
        username: data.username,
        password: data.password,
      });
      
      if (success) {
        // Then create farmer profile
        try {
          await apiRequest('POST', '/api/farmer/profile', {
            name: data.name,
            fatherName: data.fatherName,
            age: data.age,
            gender: data.gender,
            category: data.category,
            mobileNumber: data.mobileNumber,
            aadharNumber: data.aadharNumber,
            address: data.address,
            village: data.village,
            district: data.district,
            state: data.state,
            pincode: data.pincode,
            language: data.language,
          });
          
          toast({
            title: "Registration Successful",
            description: "Your account and farmer profile have been created successfully.",
          });
          setLocation("/dashboard");
        } catch (profileError: any) {
          toast({
            title: "Profile Creation Failed",
            description: "Account created but profile setup failed. Please complete your profile.",
            variant: "destructive",
          });
          setLocation("/profile");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Validate step 1 fields
    const step1Fields = ['username', 'password', 'confirmPassword'];
    const isStep1Valid = step1Fields.every(field => {
      const value = form.getValues(field as keyof RegisterForm);
      return value && value.toString().length > 0;
    });
    
    if (isStep1Valid && form.getValues('password') === form.getValues('confirmPassword')) {
      setStep(2);
    } else {
      form.trigger(['username', 'password', 'confirmPassword']);
    }
  };

  const previousStep = () => {
    setStep(1);
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
          <div className="flex items-center justify-center space-x-2 mb-4" data-testid="register-header">
            <Leaf className="text-primary text-4xl" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FMS</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-hindi">किसान प्रबंधन प्रणाली</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'hi' ? 'नया खाता बनाएं' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {language === 'hi' 
              ? 'सरकारी योजनाओं के लिए पंजीकरण करें' 
              : 'Register to access government schemes'}
          </p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Create your farmer account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="register-form">
                {step === 1 && (
                  <>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">Step 1: Account Details</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Create your login credentials</p>
                    </div>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Choose a username" 
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
                          placeholder="Create a password (min. 6 characters)" 
                          {...field}
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Confirm your password" 
                          {...field}
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                    <Button 
                      type="button"
                      onClick={nextStep}
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                      data-testid="button-next-step"
                    >
                      Next: Personal Details
                    </Button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">Step 2: Personal Information</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Complete your farmer profile</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fatherName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Father's Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter father's name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter your age"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="obc">OBC</SelectItem>
                                <SelectItem value="sc">SC</SelectItem>
                                <SelectItem value="st">ST</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="10-digit mobile number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="aadharNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aadhar Number</FormLabel>
                            <FormControl>
                              <Input placeholder="12-digit Aadhar number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address *</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Complete address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="village"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Village *</FormLabel>
                            <FormControl>
                              <Input placeholder="Village name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="district"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>District *</FormLabel>
                            <FormControl>
                              <Input placeholder="District name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State *</FormLabel>
                            <FormControl>
                              <Input placeholder="State name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode *</FormLabel>
                            <FormControl>
                              <Input placeholder="6-digit pincode" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Language</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="hi">हिंदी</SelectItem>
                                <SelectItem value="te">తెలుగు</SelectItem>
                                <SelectItem value="ta">தமிழ்</SelectItem>
                                <SelectItem value="bn">বাংলা</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex space-x-4">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={previousStep}
                        className="flex-1"
                        data-testid="button-previous-step"
                      >
                        Previous
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-primary hover:bg-primary/90 text-white"
                        disabled={isSubmitting}
                        data-testid="button-register"
                      >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Button 
                  variant="link" 
                  onClick={() => setLocation('/login')}
                  className="text-primary hover:text-primary/90 p-0 h-auto"
                  data-testid="link-login"
                >
                  Sign in here
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Information */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">Next Steps:</p>
          <p className="text-xs text-green-600 dark:text-green-400">
            After registration, complete your farmer profile to get personalized scheme recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
