import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudSun, Droplets, Wind, Eye, Thermometer, AlertTriangle } from "lucide-react";

export default function WeatherWidget() {
  const { data: weatherData, isLoading, error } = useQuery({
    queryKey: ["/api/weather"],
    refetchInterval: 300000, // Refresh every 5 minutes
  }) as { data: any, isLoading: boolean, error: any };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <CloudSun className="w-5 h-5 mr-2" />
            Weather Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !weatherData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <CloudSun className="w-5 h-5 mr-2" />
            Weather Update
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4" data-testid="weather-error">
            <CloudSun className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Weather data unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTemperatureColor = (temp: number) => {
    if (temp > 35) return 'text-red-500';
    if (temp > 25) return 'text-orange-500';
    if (temp > 15) return 'text-green-500';
    return 'text-blue-500';
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity > 80) return 'text-blue-600';
    if (humidity > 60) return 'text-blue-400';
    if (humidity > 40) return 'text-green-500';
    return 'text-orange-500';
  };

  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white" data-testid="weather-widget">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center">
            <CloudSun className="w-5 h-5 mr-2" />
            Weather Update
          </div>
          <div className="text-2xl">
            <CloudSun />
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm" data-testid="weather-location">
            {weatherData.location}
          </span>
          <span className={`text-2xl font-bold ${getTemperatureColor(weatherData.temperature)}`} data-testid="weather-temperature">
            {weatherData.temperature}°C
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4" />
          <span className="text-sm capitalize" data-testid="weather-condition">
            {weatherData.condition}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-400">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Droplets className="w-4 h-4 mr-1" />
              <p className="text-xs opacity-80">Humidity</p>
            </div>
            <p className={`font-semibold ${getHumidityColor(weatherData.humidity)}`} data-testid="weather-humidity">
              {weatherData.humidity}%
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Wind className="w-4 h-4 mr-1" />
              <p className="text-xs opacity-80">Wind</p>
            </div>
            <p className="font-semibold" data-testid="weather-wind">
              {weatherData.windSpeed} km/h
            </p>
          </div>
        </div>
        
        {weatherData.alerts && weatherData.alerts.length > 0 && (
          <div className="space-y-2">
            {weatherData.alerts.slice(0, 2).map((alert: any, index: number) => (
              <div 
                key={index}
                className={`bg-white/20 rounded-lg p-2 flex items-start space-x-2 ${
                  alert.severity === 'high' ? 'border-l-4 border-red-400' :
                  alert.severity === 'medium' ? 'border-l-4 border-orange-400' :
                  'border-l-4 border-yellow-400'
                }`}
                data-testid={`weather-alert-${index}`}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-blue-400/30 rounded-lg p-3 mt-4">
          <div className="flex items-start space-x-2">
            <Thermometer className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium mb-1">Farming Advice</p>
              <p className="text-xs opacity-90" data-testid="weather-advice">
                {weatherData.farmingAdvice}
              </p>
            </div>
          </div>
        </div>
        
        {weatherData.forecast && weatherData.forecast.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium mb-2 opacity-80">3-Day Forecast</p>
            <div className="grid grid-cols-3 gap-2">
              {weatherData.forecast.slice(0, 3).map((day: any, index: number) => (
                <div key={index} className="text-center bg-white/10 rounded p-2" data-testid={`forecast-day-${index}`}>
                  <p className="text-xs opacity-75">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </p>
                  <p className="text-xs font-medium">
                    {day.tempHigh}°/{day.tempLow}°
                  </p>
                  <p className="text-xs opacity-75 capitalize truncate">
                    {day.condition}
                  </p>
                  {day.precipitation > 0 && (
                    <p className="text-xs text-blue-200">
                      {day.precipitation}mm
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
