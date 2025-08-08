import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer,
  AlertTriangle,
  MapPin,
  Calendar,
  TrendingUp
} from "lucide-react";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{
    date: string;
    tempHigh: number;
    tempLow: number;
    condition: string;
    precipitation: number;
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    startTime: string;
    endTime: string;
  }>;
  farmingAdvice: string;
}

const getWeatherIcon = (condition: string) => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('rain')) return <CloudRain className="w-8 h-8 text-blue-500" />;
  if (conditionLower.includes('cloud')) return <Cloud className="w-8 h-8 text-gray-500" />;
  if (conditionLower.includes('sun') || conditionLower.includes('clear')) return <Sun className="w-8 h-8 text-yellow-500" />;
  return <Cloud className="w-8 h-8 text-gray-500" />;
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'default';
  }
};

export default function Weather() {
  const { user } = useAuth();
  const { language, translate } = useLanguage();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Fetch weather data
  const { data: weatherData, isLoading, error } = useQuery({
    queryKey: ["/api/weather"],
    enabled: !!user,
  }) as { data: WeatherData, isLoading: boolean, error: any };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load weather data. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Weather Information
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Current weather conditions and forecast for your location
            </p>
          </div>
        </div>

        {weatherData && (
          <div className="space-y-6">
            {/* Current Weather */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Weather Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Current Weather</span>
                  </CardTitle>
                  <CardDescription>{weatherData.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getWeatherIcon(weatherData.condition)}
                      <div>
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">
                          {weatherData.temperature > 0 ? `${weatherData.temperature}°C` : "N/A"}
                        </div>
                        <div className="text-lg text-gray-600 dark:text-gray-400 capitalize">
                          {weatherData.condition}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Droplets className="w-4 h-4" />
                        <span>{weatherData.humidity > 0 ? `${weatherData.humidity}%` : "N/A"}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Wind className="w-4 h-4" />
                        <span>{weatherData.windSpeed > 0 ? `${weatherData.windSpeed} km/h` : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Farming Advice */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Farming Advice</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {weatherData.farmingAdvice}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Weather Alerts */}
            {weatherData.alerts && weatherData.alerts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Weather Alerts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {weatherData.alerts.map((alert, index) => (
                    <Alert key={index} variant={getSeverityColor(alert.severity) as any}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-1 capitalize">{alert.type.replace('_', ' ')}</div>
                        <div className="text-sm">{alert.message}</div>
                        <div className="text-xs mt-2 text-gray-500">
                          {new Date(alert.startTime).toLocaleString()} - {new Date(alert.endTime).toLocaleString()}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* 5-Day Forecast */}
            {weatherData.forecast && weatherData.forecast.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>5-Day Forecast</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {weatherData.forecast.map((day, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="text-center space-y-2">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {new Date(day.date).toLocaleDateString(undefined, { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="flex justify-center">
                            {getWeatherIcon(day.condition)}
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {day.tempHigh}°
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {day.tempLow}°
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {day.condition}
                          </div>
                          {day.precipitation > 0 && (
                            <div className="flex items-center justify-center space-x-1 text-xs text-blue-600">
                              <Droplets className="w-3 h-3" />
                              <span>{day.precipitation}%</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Location Message */}
            {weatherData.temperature === 0 && (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Location Not Set</div>
                  <div className="text-sm">
                    Please update your location in your profile to get accurate weather information.
                    Go to Profile → Location tab and click "Update Location" to enable GPS or manually enter your address.
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}