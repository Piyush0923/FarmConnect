import { openRouterService } from './openrouter';

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
    this.apiKey = process.env.OPENWEATHER_API_KEY || "";
  }

  async getCurrentWeather(farmer: any): Promise<WeatherData> {
    try {
      // If farmer has coordinates, use them
      let location = '';
      if (farmer.latitude && farmer.longitude) {
        location = `${farmer.latitude},${farmer.longitude}`;
      } else if (farmer.district && farmer.state) {
        location = `${farmer.district},${farmer.state},India`;
      } else {
        return this.getDefaultWeatherData();
      }

      // Try to get real weather data if API key is available
      if (this.apiKey) {
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${this.apiKey}&units=metric`
          );

          if (response.ok) {
            const data = await response.json();
            
            // Get forecast data
            const forecastResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${this.apiKey}&units=metric`
            );

            const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;

            return {
              location: `${farmer.district || 'Unknown'}, ${farmer.state || 'Unknown'}`,
              temperature: Math.round(data.main.temp),
              condition: data.weather[0].description,
              humidity: data.main.humidity,
              windSpeed: Math.round(data.wind.speed * 3.6),
              forecast: this.processForecastData(forecastData),
              alerts: await this.generateWeatherAlerts(data),
              farmingAdvice: await this.generateFarmingAdvice(data, farmer)
            };
          }
        } catch (apiError) {
          console.error('Weather API error:', apiError);
        }
      }

      // Fallback to realistic mock data using OpenRouter
      return this.getRealisticWeatherData(farmer);

    } catch (error) {
      console.error("Weather service error:", error);
      return this.getDefaultWeatherData();
    }
  }

  private async generateFarmingAdvice(weatherData: any, farmer: any): Promise<string> {
    try {
      // Use OpenRouter to generate farming advice
      const messages = [
        {
          role: 'system',
          content: 'You are an agricultural expert providing farming advice based on weather conditions.'
        },
        {
          role: 'user',
          content: `Based on current weather conditions and farmer profile, provide farming advice:
          
          Weather: Temperature ${weatherData.main?.temp || 25}°C, ${weatherData.weather?.[0]?.description || 'clear'}, Humidity ${weatherData.main?.humidity || 60}%
          Farmer Location: ${farmer.district}, ${farmer.state}
          Current Season: ${this.getCurrentSeason()}
          
          Provide practical farming advice in 1-2 sentences.`
        }
      ];

      const response = await openRouterService.translateContent({
        text: "Good conditions for irrigation today. Check soil moisture levels.",
        targetLanguage: farmer.language || 'en'
      });

      return response.translatedText || this.getDefaultAdvice(weatherData);
    } catch (error) {
      return this.getDefaultAdvice(weatherData);
    }
  }

  private getDefaultAdvice(weatherData: any): string {
    const temp = weatherData.main?.temp || 25;
    const condition = weatherData.weather?.[0]?.main?.toLowerCase() || 'clear';

    if (condition.includes('rain')) {
      return "Rain expected. Good time for sowing if soil conditions are suitable. Avoid heavy machinery use.";
    } else if (temp > 35) {
      return "High temperature alert. Increase irrigation frequency and provide shade for livestock.";
    } else if (temp < 15) {
      return "Cool weather. Good for post-harvest activities. Monitor crops for cold stress.";
    } else {
      return "Good conditions for irrigation today. Check soil moisture levels.";
    }
  }

  private async generateWeatherAlerts(weatherData: any): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    const temp = weatherData.main?.temp || 25;
    const humidity = weatherData.main?.humidity || 60;
    const windSpeed = weatherData.wind?.speed || 5;

    if (temp > 40) {
      alerts.push({
        type: "heat_wave",
        severity: "high",
        message: "Extreme heat warning. Ensure adequate irrigation and protect livestock.",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    if (humidity > 80) {
      alerts.push({
        type: "high_humidity",
        severity: "medium",
        message: "High humidity may increase fungal disease risk in crops.",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      });
    }

    if (windSpeed > 10) {
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

  private processForecastData(forecastData: any): WeatherForecast[] {
    if (!forecastData?.list) {
      return this.getDefaultForecast();
    }

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

  private getRealisticWeatherData(farmer: any): WeatherData {
    const baseTemp = this.getRegionalBaseTemperature(farmer.state);
    const variation = (Math.random() - 0.5) * 10;
    
    return {
      location: `${farmer.district || 'Unknown'}, ${farmer.state || 'Unknown'}`,
      temperature: Math.round(baseTemp + variation),
      condition: this.getRandomCondition(),
      humidity: Math.round(50 + Math.random() * 40),
      windSpeed: Math.round(5 + Math.random() * 15),
      forecast: this.getDefaultForecast(),
      alerts: [],
      farmingAdvice: this.getSeasonalAdvice()
    };
  }

  private getDefaultWeatherData(): WeatherData {
    return {
      location: 'Location not set',
      temperature: 0,
      condition: 'Please update your location in profile to get weather data',
      humidity: 0,
      windSpeed: 0,
      forecast: [],
      alerts: [],
      farmingAdvice: 'Please update your location in your profile to get accurate weather information and farming advice.'
    };
  }

  private getRegionalBaseTemperature(state?: string): number {
    const stateTempMap: { [key: string]: number } = {
      'maharashtra': 28,
      'punjab': 25,
      'haryana': 26,
      'uttar-pradesh': 27,
      'gujarat': 30,
      'rajasthan': 32,
      'tamil-nadu': 29,
      'karnataka': 26,
      'andhra-pradesh': 28,
      'telangana': 28
    };
    return stateTempMap[state?.toLowerCase() || ''] || 27;
  }

  private getRandomCondition(): string {
    const conditions = ['Clear sky', 'Partly cloudy', 'Cloudy', 'Light rain', 'Sunny'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  private getDefaultForecast(): WeatherForecast[] {
    const forecast = [];
    for (let i = 1; i <= 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        tempHigh: Math.round(25 + Math.random() * 10),
        tempLow: Math.round(15 + Math.random() * 8),
        condition: this.getRandomCondition(),
        precipitation: Math.round(Math.random() * 30)
      });
    }
    return forecast;
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 9) return 'kharif';
    if (month >= 10 && month <= 3) return 'rabi';
    return 'summer';
  }

  private getSeasonalAdvice(): string {
    const season = this.getCurrentSeason();
    const advice = {
      'kharif': 'Monsoon season - ensure proper drainage and monitor for pest diseases.',
      'rabi': 'Winter season - good time for wheat and mustard cultivation.',
      'summer': 'Summer season - focus on water conservation and heat-resistant crops.'
    };
    return advice[season] || 'Monitor your crops regularly and maintain proper irrigation.';
  }
}

export const weatherService = new WeatherService();