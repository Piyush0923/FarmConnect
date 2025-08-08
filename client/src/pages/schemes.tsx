import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import Layout from "@/components/layout";
import SchemeCard from "@/components/scheme-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, FileText, Bookmark, Clock, CheckCircle, X } from "lucide-react";

export default function Schemes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Fetch schemes data
  const { data: allSchemes, isLoading: allSchemesLoading } = useQuery({
    queryKey: ["/api/schemes", { category: selectedCategory, state: selectedState }],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  const { data: recommendedSchemes, isLoading: recommendedLoading } = useQuery({
    queryKey: ["/api/schemes/recommended"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  const { data: bookmarks, isLoading: bookmarksLoading } = useQuery({
    queryKey: ["/api/bookmarks"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  // Mutations
  const bookmarkMutation = useMutation({
    mutationFn: (data: { schemeId: string; action: 'add' | 'remove' }) => {
      if (data.action === 'add') {
        return apiRequest('POST', '/api/bookmarks', { schemeId: data.schemeId });
      } else {
        return apiRequest('DELETE', `/api/bookmarks/${data.schemeId}`);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schemes/recommended"] });
      toast({
        title: variables.action === 'add' ? "Scheme Bookmarked" : "Bookmark Removed",
        description: variables.action === 'add' 
          ? "Scheme has been added to your bookmarks" 
          : "Scheme has been removed from bookmarks",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (schemeId: string) => 
      apiRequest('POST', '/api/applications', { 
        schemeId, 
        status: 'pending',
        applicationData: {}
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application Submitted",
        description: "Your scheme application has been submitted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  // Filter schemes based on search and filters
  const filteredSchemes = (schemes: any[]) => {
    if (!schemes) return [];
    
    return schemes.filter(scheme => {
      const matchesSearch = !searchQuery || 
        scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  };

  // Get bookmarked schemes
  const bookmarkedSchemes = bookmarks?.map((bookmark: any) => 
    allSchemes?.find((scheme: any) => scheme.id === bookmark.schemeId)
  ).filter(Boolean) || [];

  // Get applied schemes
  const appliedSchemes = applications?.map((app: any) => ({
    ...app.scheme,
    applicationStatus: app.status,
    applicationId: app.id
  })) || [];

  const handleBookmark = (schemeId: string, isBookmarked: boolean) => {
    bookmarkMutation.mutate({ 
      schemeId, 
      action: isBookmarked ? 'remove' : 'add' 
    });
  };

  const handleApply = (scheme: any) => {
    // Get the scheme's application URL
    const applicationUrl = getSchemeApplicationUrl(scheme);
    
    if (applicationUrl) {
      // Open external government website
      window.open(applicationUrl, '_blank', 'noopener,noreferrer');
      
      // Also create application record for tracking
      applyMutation.mutate(scheme.id);
    } else {
      // Fallback: just create application record
      applyMutation.mutate(scheme.id);
    }
  };

  const getSchemeApplicationUrl = (scheme: any) => {
    // Map scheme names to their official application URLs
    const schemeUrls: Record<string, string> = {
      'PM-KISAN Scheme': 'https://pmkisan.gov.in/',
      'Pradhan Mantri Fasal Bima Yojana': 'https://pmfby.gov.in/',
      'Soil Health Card Scheme': 'https://soilhealth.dac.gov.in/',
      'Maharashtra State Agriculture Loan Waiver': 'https://krishi.maharashtra.gov.in/',
      'Punjab Crop Diversification Scheme': 'https://agripb.gov.in/',
    };
    
    return schemeUrls[scheme.name] || scheme.applicationProcess?.includes('http') 
      ? scheme.applicationProcess 
      : null;
  };

  const isSchemeBookmarked = (schemeId: string) => {
    return bookmarks?.some((bookmark: any) => bookmark.schemeId === schemeId) || false;
  };

  const isSchemeApplied = (schemeId: string) => {
    return applications?.some((app: any) => app.schemeId === schemeId) || false;
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Government Schemes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Discover and apply for government schemes tailored for you
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              AI Powered
            </Badge>
            <Badge variant="outline" className="border-success text-success">
              Updated Daily
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search schemes by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-schemes"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
                data-testid="button-toggle-filters"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger data-testid="select-scheme-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="central">Central Government</SelectItem>
                        <SelectItem value="state">State Government</SelectItem>
                        <SelectItem value="district">District Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State
                    </label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger data-testid="select-scheme-state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        <SelectItem value="maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="punjab">Punjab</SelectItem>
                        <SelectItem value="haryana">Haryana</SelectItem>
                        <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedState("all");
                      setSearchQuery("");
                    }}
                    data-testid="button-clear-filters"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheme Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" data-testid="tab-all-schemes">
              <FileText className="w-4 h-4 mr-2" />
              All Schemes
            </TabsTrigger>
            <TabsTrigger value="recommended" data-testid="tab-recommended">
              <CheckCircle className="w-4 h-4 mr-2" />
              Recommended
            </TabsTrigger>
            <TabsTrigger value="bookmarked" data-testid="tab-bookmarked">
              <Bookmark className="w-4 h-4 mr-2" />
              Bookmarked
            </TabsTrigger>
            <TabsTrigger value="applied" data-testid="tab-applied">
              <Clock className="w-4 h-4 mr-2" />
              Applied
            </TabsTrigger>
          </TabsList>

          {/* All Schemes Tab */}
          <TabsContent value="all" className="space-y-4">
            {allSchemesLoading ? (
              <div className="grid gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex space-x-4 mb-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-2 w-20" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredSchemes(allSchemes || []).length > 0 ? (
              <div className="grid gap-6">
                {filteredSchemes(allSchemes || []).map((scheme: any) => (
                  <SchemeCard
                    key={scheme.id}
                    scheme={scheme}
                    isBookmarked={isSchemeBookmarked(scheme.id)}
                    isApplied={isSchemeApplied(scheme.id)}
                    onBookmark={(isBookmarked) => handleBookmark(scheme.id, isBookmarked)}
                    onApply={() => handleApply(scheme)}
                    showMatchPercentage={false}
                    data-testid={`all-scheme-${scheme.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12" data-testid="no-all-schemes-message">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No schemes found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || selectedCategory !== "all" || selectedState !== "all"
                    ? "Try adjusting your search or filters"
                    : "No schemes are currently available"}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Recommended Tab */}
          <TabsContent value="recommended" className="space-y-4">
            {recommendedLoading ? (
              <div className="grid gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-5 w-16 ml-auto" />
                      </div>
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex space-x-4 mb-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-2 w-20" />
                        </div>
                        <div className="flex space-x-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendedSchemes && recommendedSchemes.length > 0 ? (
              <div className="grid gap-6">
                {filteredSchemes(recommendedSchemes).map((scheme: any) => (
                  <SchemeCard
                    key={scheme.id}
                    scheme={scheme}
                    isBookmarked={isSchemeBookmarked(scheme.id)}
                    isApplied={isSchemeApplied(scheme.id)}
                    onBookmark={(isBookmarked) => handleBookmark(scheme.id, isBookmarked)}
                    onApply={() => handleApply(scheme)}
                    showMatchPercentage={true}
                    data-testid={`recommended-scheme-${scheme.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12" data-testid="no-recommended-schemes-message">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recommendations yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Complete your profile to get personalized scheme recommendations
                </p>
                <Button
                  onClick={() => setLocation('/profile')}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-complete-profile-schemes"
                >
                  Complete Profile
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Bookmarked Tab */}
          <TabsContent value="bookmarked" className="space-y-4">
            {bookmarksLoading ? (
              <div className="grid gap-6">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex space-x-4 mb-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : bookmarkedSchemes.length > 0 ? (
              <div className="grid gap-6">
                {filteredSchemes(bookmarkedSchemes).map((scheme: any) => (
                  <SchemeCard
                    key={scheme.id}
                    scheme={scheme}
                    isBookmarked={true}
                    isApplied={isSchemeApplied(scheme.id)}
                    onBookmark={() => handleBookmark(scheme.id, true)}
                    onApply={() => handleApply(scheme)}
                    showMatchPercentage={false}
                    data-testid={`bookmarked-scheme-${scheme.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12" data-testid="no-bookmarked-schemes-message">
                <Bookmark className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bookmarked schemes</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Bookmark interesting schemes to save them for later
                </p>
              </div>
            )}
          </TabsContent>

          {/* Applied Tab */}
          <TabsContent value="applied" className="space-y-4">
            {applicationsLoading ? (
              <div className="grid gap-6">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex space-x-4 mb-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : appliedSchemes.length > 0 ? (
              <div className="grid gap-6">
                {filteredSchemes(appliedSchemes).map((scheme: any) => (
                  <SchemeCard
                    key={scheme.applicationId}
                    scheme={scheme}
                    isBookmarked={isSchemeBookmarked(scheme.id)}
                    isApplied={true}
                    applicationStatus={scheme.applicationStatus}
                    onBookmark={(isBookmarked) => handleBookmark(scheme.id, isBookmarked)}
                    onApply={() => {}} // Already applied
                    showMatchPercentage={false}
                    data-testid={`applied-scheme-${scheme.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12" data-testid="no-applied-schemes-message">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications yet</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Apply to schemes that match your profile to track them here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
