import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  MapPin, 
  Wheat, 
  Cow, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Navigation
} from "lucide-react";

// Validation schemas
const personalInfoSchema = z.object({
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
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  language: z.string().default("en"),
});

const landSchema = z.object({
  surveyNumber: z.string().optional(),
  area: z.number().min(0.1, "Area must be at least 0.1 acres"),
  landType: z.enum(["irrigated", "rain-fed", "dry"]),
  ownershipType: z.enum(["owned", "leased", "sharecropper"]),
  soilType: z.enum(["black", "red", "alluvial", "sandy", "clay"]),
});

const cropSchema = z.object({
  cropName: z.string().min(2, "Crop name is required"),
  variety: z.string().optional(),
  season: z.enum(["kharif", "rabi", "summer"]),
  area: z.number().min(0.1, "Area must be at least 0.1 acres"),
  year: z.number().min(2020).max(new Date().getFullYear() + 1),
  sowingDate: z.date().optional(),
  expectedHarvest: z.date().optional(),
});

const livestockSchema = z.object({
  animalType: z.enum(["cow", "buffalo", "goat", "sheep", "poultry"]),
  count: z.number().min(1, "Count must be at least 1"),
  breed: z.string().optional(),
});

type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
type LandForm = z.infer<typeof landSchema>;
type CropForm = z.infer<typeof cropSchema>;
type LivestockForm = z.infer<typeof livestockSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("personal");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Fetch farmer profile
  const { data: farmerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/farmer/profile"],
    enabled: !!user,
  }) as { data: any, isLoading: boolean };

  // Forms
  const personalForm = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
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
      bankAccountNumber: "",
      ifscCode: "",
      language: language,
    },
  });

  const landForm = useForm<LandForm>({
    resolver: zodResolver(landSchema),
    defaultValues: {
      surveyNumber: "",
      area: 1,
      landType: "irrigated",
      ownershipType: "owned",
      soilType: "black",
    },
  });

  const cropForm = useForm<CropForm>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      cropName: "",
      variety: "",
      season: "kharif",
      area: 1,
      year: new Date().getFullYear(),
    },
  });

  const livestockForm = useForm<LivestockForm>({
    resolver: zodResolver(livestockSchema),
    defaultValues: {
      animalType: "cow",
      count: 1,
      breed: "",
    },
  });

  // Update forms when profile data loads
  useEffect(() => {
    if (farmerProfile) {
      personalForm.reset({
        name: farmerProfile.name || "",
        fatherName: farmerProfile.fatherName || "",
        age: farmerProfile.age || 25,
        gender: farmerProfile.gender || "male",
        category: farmerProfile.category || "general",
        mobileNumber: farmerProfile.mobileNumber || "",
        aadharNumber: farmerProfile.aadharNumber || "",
        address: farmerProfile.address || "",
        village: farmerProfile.village || "",
        district: farmerProfile.district || "",
        state: farmerProfile.state || "",
        pincode: farmerProfile.pincode || "",
        bankAccountNumber: farmerProfile.bankAccountNumber || "",
        ifscCode: farmerProfile.ifscCode || "",
        language: farmerProfile.language || language,
      });
    }
  }, [farmerProfile, personalForm, language]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: PersonalInfoForm) => apiRequest('PUT', '/api/farmer/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const addLandMutation = useMutation({
    mutationFn: (data: LandForm) => apiRequest('POST', '/api/farmer/lands', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/profile"] });
      landForm.reset();
      toast({
        title: "Land Added",
        description: "Land record has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Land",
        description: error.message || "Failed to add land record",
        variant: "destructive",
      });
    },
  });

  const addCropMutation = useMutation({
    mutationFn: (data: CropForm) => apiRequest('POST', '/api/farmer/crops', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/profile"] });
      cropForm.reset();
      toast({
        title: "Crop Added",
        description: "Crop record has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Crop",
        description: error.message || "Failed to add crop record",
        variant: "destructive",
      });
    },
  });

  const addLivestockMutation = useMutation({
    mutationFn: (data: LivestockForm) => apiRequest('POST', '/api/farmer/livestock', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/profile"] });
      livestockForm.reset();
      toast({
        title: "Livestock Added",
        description: "Livestock record has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Livestock",
        description: error.message || "Failed to add livestock record",
        variant: "destructive",
      });
    },
  });

  const detectLocationMutation = useMutation({
    mutationFn: (address: string) => apiRequest('POST', '/api/location/detect', { address }),
    onSuccess: (response: any) => {
      if (response.ok) {
        const data = response.json();
        personalForm.setValue('district', data.district);
        personalForm.setValue('state', data.state);
        queryClient.invalidateQueries({ queryKey: ["/api/farmer/profile"] });
        toast({
          title: "Location Updated",
          description: "Your location has been detected and updated.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Location Detection Failed",
        description: error.message || "Failed to detect location",
        variant: "destructive",
      });
    },
  });

  // Handle location detection
  const handleDetectLocation = async () => {
    const address = personalForm.getValues('address');
    if (!address) {
      toast({
        title: "Address Required",
        description: "Please enter your address first to detect location.",
        variant: "destructive",
      });
      return;
    }

    setIsDetectingLocation(true);
    try {
      await detectLocationMutation.mutateAsync(address);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Form submission handlers
  const onSubmitPersonalInfo = (data: PersonalInfoForm) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitLand = (data: LandForm) => {
    addLandMutation.mutate(data);
  };

  const onSubmitCrop = (data: CropForm) => {
    addCropMutation.mutate(data);
  };

  const onSubmitLivestock = (data: LivestockForm) => {
    addLivestockMutation.mutate(data);
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (profileLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Farmer Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your personal information and farming details
            </p>
          </div>
          
          {farmerProfile?.isVerified ? (
            <Badge className="bg-success text-white">
              <CheckCircle className="w-4 h-4 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="border-warning text-warning">
              <AlertCircle className="w-4 h-4 mr-1" />
              Incomplete
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" data-testid="tab-personal">
              <User className="w-4 h-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="land" data-testid="tab-land">
              <MapPin className="w-4 h-4 mr-2" />
              Land
            </TabsTrigger>
            <TabsTrigger value="crops" data-testid="tab-crops">
              <Wheat className="w-4 h-4 mr-2" />
              Crops
            </TabsTrigger>
            <TabsTrigger value="livestock" data-testid="tab-livestock">
              <Cow className="w-4 h-4 mr-2" />
              Livestock
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...personalForm}>
                  <form onSubmit={personalForm.handleSubmit(onSubmitPersonalInfo)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={personalForm.control}
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
                        control={personalForm.control}
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
                        control={personalForm.control}
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
                        control={personalForm.control}
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
                        control={personalForm.control}
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
                        control={personalForm.control}
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
                        control={personalForm.control}
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

                      <FormField
                        control={personalForm.control}
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

                    <FormField
                      control={personalForm.control}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={personalForm.control}
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
                        control={personalForm.control}
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
                        control={personalForm.control}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={personalForm.control}
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

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation}
                          className="w-full"
                        >
                          {isDetectingLocation ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Navigation className="w-4 h-4 mr-2" />
                          )}
                          Detect Location
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={personalForm.control}
                        name="bankAccountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Account Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Bank account number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={personalForm.control}
                        name="ifscCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IFSC Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Bank IFSC code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {updateProfileMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Profile
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Land Information Tab */}
          <TabsContent value="land">
            <div className="space-y-6">
              {/* Existing Land Records */}
              {farmerProfile?.lands && farmerProfile.lands.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Land Records</CardTitle>
                    <CardDescription>
                      Manage your land holdings and ownership details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {farmerProfile.lands.map((land: any, index: number) => (
                        <div key={land.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Survey Number</p>
                                <p className="text-sm">{land.surveyNumber || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Area</p>
                                <p className="text-sm">{land.area} acres</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Land Type</p>
                                <p className="text-sm capitalize">{land.landType}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Ownership</p>
                                <p className="text-sm capitalize">{land.ownershipType}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add New Land */}
              <Card>
                <CardHeader>
                  <CardTitle>Add New Land</CardTitle>
                  <CardDescription>
                    Add details about your land holdings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...landForm}>
                    <form onSubmit={landForm.handleSubmit(onSubmitLand)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={landForm.control}
                          name="surveyNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Survey Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Survey/Gat number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={landForm.control}
                          name="area"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Area (in acres) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  placeholder="Land area in acres"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={landForm.control}
                          name="landType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Land Type *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select land type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="irrigated">Irrigated</SelectItem>
                                  <SelectItem value="rain-fed">Rain-fed</SelectItem>
                                  <SelectItem value="dry">Dry Land</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={landForm.control}
                          name="ownershipType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ownership Type *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select ownership type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="owned">Owned</SelectItem>
                                  <SelectItem value="leased">Leased</SelectItem>
                                  <SelectItem value="sharecropper">Sharecropper</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={landForm.control}
                          name="soilType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Soil Type *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select soil type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="black">Black Soil</SelectItem>
                                  <SelectItem value="red">Red Soil</SelectItem>
                                  <SelectItem value="alluvial">Alluvial Soil</SelectItem>
                                  <SelectItem value="sandy">Sandy Soil</SelectItem>
                                  <SelectItem value="clay">Clay Soil</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={addLandMutation.isPending}
                          className="bg-success hover:bg-success/90"
                        >
                          {addLandMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Add Land
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Crops Tab */}
          <TabsContent value="crops">
            <div className="space-y-6">
              {/* Existing Crops */}
              {farmerProfile?.crops && farmerProfile.crops.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Crops</CardTitle>
                    <CardDescription>
                      Current and historical crop information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {farmerProfile.crops.map((crop: any) => (
                        <div key={crop.id} className="border rounded-lg p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Crop</p>
                              <p className="text-sm capitalize">{crop.cropName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Variety</p>
                              <p className="text-sm">{crop.variety || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Season</p>
                              <p className="text-sm capitalize">{crop.season}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Area</p>
                              <p className="text-sm">{crop.area} acres</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add New Crop */}
              <Card>
                <CardHeader>
                  <CardTitle>Add New Crop</CardTitle>
                  <CardDescription>
                    Add information about crops you are growing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...cropForm}>
                    <form onSubmit={cropForm.handleSubmit(onSubmitCrop)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={cropForm.control}
                          name="cropName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Crop Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Rice, Wheat, Cotton" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={cropForm.control}
                          name="variety"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Variety</FormLabel>
                              <FormControl>
                                <Input placeholder="Crop variety" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={cropForm.control}
                          name="season"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Season *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select season" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="kharif">Kharif (Monsoon)</SelectItem>
                                  <SelectItem value="rabi">Rabi (Winter)</SelectItem>
                                  <SelectItem value="summer">Summer</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={cropForm.control}
                          name="area"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Area (in acres) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  placeholder="Crop area in acres"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={cropForm.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="Crop year"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={addCropMutation.isPending}
                          className="bg-success hover:bg-success/90"
                        >
                          {addCropMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Add Crop
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Livestock Tab */}
          <TabsContent value="livestock">
            <div className="space-y-6">
              {/* Existing Livestock */}
              {farmerProfile?.livestock && farmerProfile.livestock.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Livestock</CardTitle>
                    <CardDescription>
                      Manage your livestock and animal husbandry details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {farmerProfile.livestock.map((animal: any) => (
                        <div key={animal.id} className="border rounded-lg p-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Animal Type</p>
                              <p className="text-sm capitalize">{animal.animalType}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Count</p>
                              <p className="text-sm">{animal.count}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Breed</p>
                              <p className="text-sm">{animal.breed || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add New Livestock */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Livestock</CardTitle>
                  <CardDescription>
                    Add information about your animals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...livestockForm}>
                    <form onSubmit={livestockForm.handleSubmit(onSubmitLivestock)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={livestockForm.control}
                          name="animalType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Animal Type *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select animal type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="cow">Cow</SelectItem>
                                  <SelectItem value="buffalo">Buffalo</SelectItem>
                                  <SelectItem value="goat">Goat</SelectItem>
                                  <SelectItem value="sheep">Sheep</SelectItem>
                                  <SelectItem value="poultry">Poultry</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={livestockForm.control}
                          name="count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Count *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="Number of animals"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={livestockForm.control}
                          name="breed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Breed</FormLabel>
                              <FormControl>
                                <Input placeholder="Animal breed" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={addLivestockMutation.isPending}
                          className="bg-success hover:bg-success/90"
                        >
                          {addLivestockMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Add Livestock
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}