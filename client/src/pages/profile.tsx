import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, MapPin, Crop, PiggyBank, Plus, Edit, Save, Navigation } from "lucide-react";

const farmerProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().optional(),
  age: z.number().min(18, "Age must be at least 18").max(100, "Age must be less than 100"),
  gender: z.enum(["male", "female", "other"]),
  category: z.enum(["general", "obc", "sc", "st"]),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar number must be 12 digits").optional(),
  mobileNumber: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
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
  area: z.string().min(1, "Area is required"),
  landType: z.enum(["irrigated", "rain-fed", "dry"]),
  ownershipType: z.enum(["owned", "leased", "sharecropper"]),
  soilType: z.string().optional(),
});

const cropSchema = z.object({
  cropName: z.string().min(2, "Crop name is required"),
  variety: z.string().optional(),
  season: z.enum(["kharif", "rabi", "summer"]),
  area: z.string().min(1, "Area is required"),
  year: z.number().default(new Date().getFullYear()),
});

const livestockSchema = z.object({
  animalType: z.enum(["cow", "buffalo", "goat", "sheep", "poultry"]),
  count: z.number().min(1, "Count must be at least 1"),
  breed: z.string().optional(),
});

type FarmerProfileForm = z.infer<typeof farmerProfileSchema>;
type LandForm = z.infer<typeof landSchema>;
type CropForm = z.infer<typeof cropSchema>;
type LivestockForm = z.infer<typeof livestockSchema>;

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [showAddLand, setShowAddLand] = useState(false);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [showAddLivestock, setShowAddLivestock] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Fetch farmer profile
  const { data: farmerProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["/api/farmer/profile"],
    enabled: !!user,
  }) as { data: any, isLoading: boolean, error: any };

  // Forms
  const profileForm = useForm<FarmerProfileForm>({
    resolver: zodResolver(farmerProfileSchema),
    defaultValues: {
      name: "",
      age: 25,
      gender: "male",
      category: "general",
      mobileNumber: "",
      address: "",
      village: "",
      district: "",
      state: "",
      pincode: "",
      language: "en",
    },
  });

  const landForm = useForm<LandForm>({
    resolver: zodResolver(landSchema),
    defaultValues: {
      area: "",
      landType: "irrigated",
      ownershipType: "owned",
    },
  });

  const cropForm = useForm<CropForm>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      cropName: "",
      season: "kharif",
      area: "",
      year: new Date().getFullYear(),
    },
  });

  const livestockForm = useForm<LivestockForm>({
    resolver: zodResolver(livestockSchema),
    defaultValues: {
      animalType: "cow",
      count: 1,
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (farmerProfile) {
      profileForm.reset({
        name: farmerProfile.name || "",
        fatherName: farmerProfile.fatherName || "",
        age: farmerProfile.age || 25,
        gender: farmerProfile.gender || "male",
        category: farmerProfile.category || "general",
        aadharNumber: farmerProfile.aadharNumber || "",
        mobileNumber: farmerProfile.mobileNumber || "",
        address: farmerProfile.address || "",
        village: farmerProfile.village || "",
        district: farmerProfile.district || "",
        state: farmerProfile.state || "",
        pincode: farmerProfile.pincode || "",
        bankAccountNumber: farmerProfile.bankAccountNumber || "",
        ifscCode: farmerProfile.ifscCode || "",
        language: farmerProfile.language || "en",
      });
    }
  }, [farmerProfile, profileForm]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => {
      const url = farmerProfile ? "/api/farmer/profile" : "/api/farmer/profile";
      const method = farmerProfile ? "PUT" : "POST";
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
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
    mutationFn: (data: LandForm) => apiRequest("POST", "/api/farmer/lands", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/profile"] });
      toast({ title: "Land Added", description: "Land information has been added successfully." });
      setShowAddLand(false);
      landForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Land",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addCropMutation = useMutation({
    mutationFn: (data: CropForm) => apiRequest("POST", "/api/farmer/crops", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/profile"] });
      toast({ title: "Crop Added", description: "Crop information has been added successfully." });
      setShowAddCrop(false);
      cropForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Crop",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addLivestockMutation = useMutation({
    mutationFn: (data: LivestockForm) => apiRequest("POST", "/api/farmer/livestock", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/profile"] });
      toast({ title: "Livestock Added", description: "Livestock information has been added successfully." });
      setShowAddLivestock(false);
      livestockForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Livestock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = (data: FarmerProfileForm) => {
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address details
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=demo&limit=1`
          );
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const components = result.components;
            
            // Update form with location data
            profileForm.setValue('state', components.state || '');
            profileForm.setValue('district', components.state_district || components.county || '');
            profileForm.setValue('village', components.village || components.town || components.city || '');
            profileForm.setValue('pincode', components.postcode || '');
            
            // Update address if empty
            if (!profileForm.getValues('address')) {
              profileForm.setValue('address', result.formatted || '');
            }
            
            toast({
              title: "Location Updated",
              description: "Your location has been automatically filled. Please review and save.",
            });
          }
        } catch (error) {
          // Still update with coordinates
          toast({
            title: "Location Retrieved",
            description: "Coordinates obtained. Please fill in address details manually.",
          });
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        let message = "Failed to get location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please allow location access and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (profileLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
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
          
          {farmerProfile && (
            <div className="flex items-center space-x-2">
              {farmerProfile.isVerified ? (
                <Badge className="bg-success text-white">Verified</Badge>
              ) : (
                <Badge variant="outline" className="border-warning text-warning">Pending Verification</Badge>
              )}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" data-testid="tab-personal">
              <User className="w-4 h-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="location" data-testid="tab-location">
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </TabsTrigger>
            <TabsTrigger value="farming" data-testid="tab-farming">
              <Crop className="w-4 h-4 mr-2" />
              Farming
            </TabsTrigger>
            <TabsTrigger value="financial" data-testid="tab-financial">
              <PiggyBank className="w-4 h-4 mr-2" />
              Financial
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Basic personal details and identification</CardDescription>
                </div>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                  data-testid="button-edit-personal"
                >
                  {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                disabled={!isEditing}
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="fatherName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Father's Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                disabled={!isEditing}
                                data-testid="input-father-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                disabled={!isEditing}
                                data-testid="input-age"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={!isEditing}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-gender">
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
                        control={profileForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={!isEditing}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
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
                        control={profileForm.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="10-digit mobile number"
                                disabled={!isEditing}
                                data-testid="input-mobile"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="aadharNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aadhar Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="12-digit Aadhar number"
                                disabled={!isEditing}
                                data-testid="input-aadhar"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          data-testid="button-cancel-personal"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-primary hover:bg-primary/90"
                          disabled={updateProfileMutation.isPending}
                          data-testid="button-save-personal"
                        >
                          {updateProfileMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Location Details</CardTitle>
                  <CardDescription>Address and location information</CardDescription>
                </div>
                <Button
                  onClick={getCurrentLocation}
                  variant="outline"
                  size="sm"
                  disabled={isGettingLocation || !isEditing}
                  data-testid="button-get-location"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 mr-2" />
                  )}
                  {isGettingLocation ? "Getting Location..." : "Update Location"}
                </Button>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Complete address"
                              disabled={!isEditing}
                              data-testid="textarea-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="village"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Village *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!isEditing}
                            data-testid="input-village"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!isEditing}
                            data-testid="input-district"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!isEditing}
                            data-testid="input-state"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="6-digit pincode"
                            disabled={!isEditing}
                            data-testid="input-pincode"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Farming Tab */}
          <TabsContent value="farming">
            <div className="space-y-6">
              {/* Land Holdings */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Land Holdings</CardTitle>
                    <CardDescription>Details about your land parcels</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowAddLand(true)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-add-land"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Land
                  </Button>
                </CardHeader>
                <CardContent>
                  {farmerProfile?.lands && farmerProfile.lands.length > 0 ? (
                    <div className="space-y-4">
                      {farmerProfile.lands.map((land: any, index: number) => (
                        <div key={land.id} className="border rounded-lg p-4" data-testid={`land-item-${index}`}>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-500">Area</p>
                              <p>{land.area} acres</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Type</p>
                              <p className="capitalize">{land.landType}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Ownership</p>
                              <p className="capitalize">{land.ownershipType}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Survey No.</p>
                              <p>{land.surveyNumber || "Not specified"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500" data-testid="no-lands-message">
                      <p>No land information added yet</p>
                      <p className="text-sm mt-1">Add your land details to get better scheme recommendations</p>
                    </div>
                  )}

                  {showAddLand && (
                    <Card className="mt-4 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">Add Land Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Form {...landForm}>
                          <form onSubmit={landForm.handleSubmit(onSubmitLand)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={landForm.control}
                                name="area"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Area (acres) *</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="e.g., 2.5" data-testid="input-land-area" />
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
                                        <SelectTrigger data-testid="select-land-type">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="irrigated">Irrigated</SelectItem>
                                        <SelectItem value="rain-fed">Rain-fed</SelectItem>
                                        <SelectItem value="dry">Dry</SelectItem>
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
                                    <FormLabel>Ownership *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-ownership-type">
                                          <SelectValue />
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
                                name="surveyNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Survey Number</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Optional" data-testid="input-survey-number" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-end space-x-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddLand(false)}
                                data-testid="button-cancel-land"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90"
                                disabled={addLandMutation.isPending}
                                data-testid="button-save-land"
                              >
                                {addLandMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Land
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Crops */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Crops</CardTitle>
                    <CardDescription>Current and historical crop information</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowAddCrop(true)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-add-crop"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Crop
                  </Button>
                </CardHeader>
                <CardContent>
                  {farmerProfile?.crops && farmerProfile.crops.length > 0 ? (
                    <div className="space-y-4">
                      {farmerProfile.crops.map((crop: any, index: number) => (
                        <div key={crop.id} className="border rounded-lg p-4" data-testid={`crop-item-${index}`}>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-500">Crop</p>
                              <p>{crop.cropName}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Season</p>
                              <p className="capitalize">{crop.season}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Area</p>
                              <p>{crop.area} acres</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Year</p>
                              <p>{crop.year}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500" data-testid="no-crops-message">
                      <p>No crop information added yet</p>
                      <p className="text-sm mt-1">Add your crop details for better recommendations</p>
                    </div>
                  )}

                  {showAddCrop && (
                    <Card className="mt-4 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">Add Crop Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Form {...cropForm}>
                          <form onSubmit={cropForm.handleSubmit(onSubmitCrop)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={cropForm.control}
                                name="cropName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Crop Name *</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="e.g., Rice, Wheat, Cotton" data-testid="input-crop-name" />
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
                                      <Input {...field} placeholder="e.g., PR 106, Lok 1" data-testid="input-crop-variety" />
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
                                        <SelectTrigger data-testid="select-crop-season">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="kharif">Kharif</SelectItem>
                                        <SelectItem value="rabi">Rabi</SelectItem>
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
                                    <FormLabel>Area (acres) *</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="e.g., 1.5" data-testid="input-crop-area" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-end space-x-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddCrop(false)}
                                data-testid="button-cancel-crop"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90"
                                disabled={addCropMutation.isPending}
                                data-testid="button-save-crop"
                              >
                                {addCropMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Crop
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Livestock */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Livestock</CardTitle>
                    <CardDescription>Information about your animals</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowAddLivestock(true)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-add-livestock"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Livestock
                  </Button>
                </CardHeader>
                <CardContent>
                  {farmerProfile?.livestock && farmerProfile.livestock.length > 0 ? (
                    <div className="space-y-4">
                      {farmerProfile.livestock.map((animal: any, index: number) => (
                        <div key={animal.id} className="border rounded-lg p-4" data-testid={`livestock-item-${index}`}>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-500">Animal Type</p>
                              <p className="capitalize">{animal.animalType}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Count</p>
                              <p>{animal.count}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Breed</p>
                              <p>{animal.breed || "Not specified"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500" data-testid="no-livestock-message">
                      <p>No livestock information added yet</p>
                      <p className="text-sm mt-1">Add livestock details if applicable</p>
                    </div>
                  )}

                  {showAddLivestock && (
                    <Card className="mt-4 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">Add Livestock Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Form {...livestockForm}>
                          <form onSubmit={livestockForm.handleSubmit(onSubmitLivestock)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={livestockForm.control}
                                name="animalType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Animal Type *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-animal-type">
                                          <SelectValue />
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
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        placeholder="Number of animals"
                                        data-testid="input-livestock-count"
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
                                      <Input {...field} placeholder="Optional" data-testid="input-livestock-breed" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-end space-x-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddLivestock(false)}
                                data-testid="button-cancel-livestock"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90"
                                disabled={addLivestockMutation.isPending}
                                data-testid="button-save-livestock"
                              >
                                {addLivestockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Livestock
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>Bank account and financial details for benefit transfers</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={profileForm.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Bank account number"
                            disabled={!isEditing}
                            data-testid="input-bank-account"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Bank IFSC code"
                            disabled={!isEditing}
                            data-testid="input-ifsc-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                </Form>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <PiggyBank className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Why we need this information
                      </h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                        <p>
                          Bank account details are required for direct benefit transfer (DBT) of scheme payments.
                          Your information is encrypted and secure.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
