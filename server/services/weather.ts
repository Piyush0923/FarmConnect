import type { Farmer } from "@shared/schema";

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
  farmingAdvice: string;
}

export interface WeatherForecast {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  precipitation: number;
}

export interface WeatherAlert {
  type: string;
  severity: string;
  message: string;
  startTime: string;
  endTime: string;
}

export class WeatherService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || "";
  }

  async getCurrentWeather(farmer: Farmer): Promise<WeatherData> {
    try {
      const location = farmer.latitude && farmer.longitude 
        ? `${farmer.latitude},${farmer.longitude}`
        : `${farmer.district},${farmer.state},India`;

      // If no API key is available, return mock data structure
      if (!this.apiKey) {
        return this.getMockWeatherData(farmer);
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error("Weather API request failed");
      }

      const data = await response.json();
      
      // Get forecast data
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${this.apiKey}&units=metric`
      );

      const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;

      return {
        location: `${farmer.district}, ${farmer.state}`,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        forecast: this.processForecastData(forecastData),
        alerts: await this.getWeatherAlerts(farmer, data),
        farmingAdvice: this.generateFarmingAdvice(data, farmer)
      };

    } catch (error) {
      console.error("Weather service error:", error);
      return this.getMockWeatherData(farmer);
    }
  }

  private getMockWeatherData(farmer: Farmer): WeatherData {
    // Handle cases where farmer location is incomplete
    let location = 'Location not set';
    if (farmer.district && farmer.state) {
      location = `${farmer.district}, ${farmer.state}`;
    } else if (farmer.state) {
      location = farmer.state;
    }
    
    return {
      location,
      temperature: farmer.district && farmer.state ? 28 : 0,
      condition: farmer.district && farmer.state ? "Partly Cloudy" : "Weather data unavailable - please update your location",
      humidity: farmer.district && farmer.state ? 65 : 0,
      windSpeed: farmer.district && farmer.state ? 12 : 0,
      forecast: [
        {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          tempHigh: 30,
          tempLow: 22,
          condition: "Sunny",
          precipitation: 0
        },
        {
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          tempHigh: 29,
          tempLow: 21,
          condition: "Partly Cloudy",
          precipitation: 10
        },
        {
          date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
          tempHigh: 27,
          tempLow: 20,
          condition: "Light Rain",
          precipitation: 60
        }
      ],
      alerts: [],
      farmingAdvice: farmer.district && farmer.state ? "Good conditions for irrigation today. Check soil moisture levels." : "Please update your location in your profile to get accurate weather information and farming advice."
    };
  }

  private processForecastData(forecastData: any): WeatherForecast[] {
    if (!forecastData || !forecastData.list) return [];

    // Group by date and get daily highs/lows
    const dailyData: { [key: string]: any } = {};
    
    forecastData.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          temps: [],
          conditions: [],
          precipitation: 0
        };
      }
      
      dailyData[date].temps.push(item.main.temp);
      dailyData[date].conditions.push(item.weather[0].description);
      
      if (item.rain) {
        dailyData[date].precipitation += item.rain['3h'] || 0;
      }
    });

    return Object.values(dailyData).slice(0, 5).map((day: any) => ({
      date: day.date,
      tempHigh: Math.round(Math.max(...day.temps)),
      tempLow: Math.round(Math.min(...day.temps)),
      condition: day.conditions[0],
      precipitation: Math.round(day.precipitation)
    }));
  }

  private async getWeatherAlerts(farmer: Farmer, weatherData: any): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    
    // Temperature alerts
    if (weatherData.main.temp > 40) {
      alerts.push({
        type: "heat_wave",
        severity: "high",
        message: "Extreme heat warning. Ensure adequate irrigation and protect livestock.",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Humidity alerts
    if (weatherData.main.humidity > 80) {
      alerts.push({
        type: "high_humidity",
        severity: "medium",
        message: "High humidity may increase fungal disease risk in crops.",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      });
    }

    // Wind alerts
    if (weatherData.wind.speed > 10) {
      alerts.push({
        type: "strong_wind",
        severity: "medium",
        message: "Strong winds may damage standing crops. Secure farm structures.",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      });
    }

    return alerts;
  }

  private generateFarmingAdvice(weatherData: any, farmer: Farmer): string {
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const condition = weatherData.weather[0].main.toLowerCase();

    if (condition.includes('rain')) {
      return "Rain expected. Good time for sowing if soil conditions are suitable. Avoid heavy machinery use.";
    } else if (temp > 35) {
      return "High temperature alert. Increase irrigation frequency and provide shade for livestock.";
    } else if (temp < 15) {
      return "Cool weather. Good for post-harvest activities. Monitor crops for cold stress.";
    } else if (humidity > 70) {
      return "High humidity detected. Monitor crops for fungal diseases and ensure good ventilation.";
    } else {
      return "Good conditions for irrigation today. Check soil moisture levels.";
    }
  }

  async getHistoricalWeather(farmer: Farmer, startDate: string, endDate: string): Promise<any> {
    // This would typically call a historical weather API
    // For now, return empty as it requires specific historical weather API access
    return {
      location: `${farmer.district}, ${farmer.state}`,
      period: { start: startDate, end: endDate },
      data: []
    };
  }
}

export const weatherService = new WeatherService();
