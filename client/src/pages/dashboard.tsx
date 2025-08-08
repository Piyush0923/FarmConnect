import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";
import Layout from "@/components/layout";
import DashboardStats from "@/components/dashboard-stats";
import SchemeCard from "@/components/scheme-card";
import WeatherWidget from "@/components/weather-widget";
import MarketPrices from "@/components/market-prices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Bell, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  }) as { data: any, isLoading: boolean };

  const { data: recommendedSchemes, isLoading: schemesLoading } = useQuery({
    queryKey: ["/api/schemes/recommended"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <DashboardStats stats={stats} isLoading={statsLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Recommended Schemes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">Recommended Schemes</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Powered by</span>
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      Gemini AI
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Personalized recommendations based on your profile</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {schemesLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-3" />
                      <div className="flex space-x-4 mb-3">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-2 w-20" />
                    </div>
                  ))
                ) : recommendedSchemes && recommendedSchemes.length > 0 ? (
                  recommendedSchemes.slice(0, 3).map((scheme: any) => (
                    <SchemeCard
                      key={scheme.id}
                      scheme={scheme}
                      showMatchPercentage={true}
                      data-testid={`scheme-card-${scheme.id}`}
                    />
                  ))
                ) : (
                  <div className="text-center py-8" data-testid="no-schemes-message">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No recommended schemes available</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Complete your profile to get personalized recommendations
                    </p>
                    <Button
                      onClick={() => setLocation('/profile')}
                      className="mt-4 bg-primary hover:bg-primary/90"
                      data-testid="button-complete-profile"
                    >
                      Complete Profile
                    </Button>
                  </div>
                )}

                {recommendedSchemes && recommendedSchemes.length > 3 && (
                  <div className="text-center pt-4">
                    <Button
                      onClick={() => setLocation('/schemes')}
                      className="bg-accent hover:bg-accent/90 text-white"
                      data-testid="button-view-all-schemes"
                    >
                      View All Schemes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weather Widget */}
            <WeatherWidget />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/profile')}
                  className="w-full justify-start p-3 hover:bg-gray-50"
                  data-testid="button-update-profile"
                >
                  <div className="bg-primary/10 p-2 rounded-lg mr-3">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Update Profile</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setLocation('/schemes')}
                  className="w-full justify-start p-3 hover:bg-gray-50"
                  data-testid="button-browse-schemes"
                >
                  <div className="bg-success/10 p-2 rounded-lg mr-3">
                    <FileText className="h-4 w-4 text-success" />
                  </div>
                  <span className="font-medium">Browse Schemes</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setLocation('/applications')}
                  className="w-full justify-start p-3 hover:bg-gray-50"
                  data-testid="button-check-status"
                >
                  <div className="bg-accent/10 p-2 rounded-lg mr-3">
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                  <span className="font-medium">Check Status</span>
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                {!notificationsLoading && notifications && notifications.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-sm text-accent hover:text-accent/90">
                    Mark all read
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {notificationsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg">
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-full mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))
                ) : notifications && notifications.length > 0 ? (
                  notifications.slice(0, 3).map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 ${
                        notification.type === 'success' ? 'bg-green-50 border-success' :
                        notification.type === 'warning' ? 'bg-orange-50 border-warning' :
                        notification.type === 'error' ? 'bg-red-50 border-destructive' :
                        'bg-blue-50 border-accent'
                      }`}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className={`p-1 rounded-full text-xs ${
                        notification.type === 'success' ? 'bg-success text-white' :
                        notification.type === 'warning' ? 'bg-warning text-white' :
                        notification.type === 'error' ? 'bg-destructive text-white' :
                        'bg-accent text-white'
                      }`}>
                        <Bell className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4" data-testid="no-notifications-message">
                    <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No new notifications</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Market Prices Section */}
        <MarketPrices />
      </main>
    </Layout>
  );
}
