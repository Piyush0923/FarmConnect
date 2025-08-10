export interface MarketPrice {
  id: string;
  commodity: string;
  variety?: string;
  market: string;
  district: string;
  state: string;
  price: number;
  unit: string;
  date: string;
  change: number;
  changePercent: number;
}

export class MarketService {
  async getCurrentPrices(state: string, district: string): Promise<MarketPrice[]> {
    try {
      // Generate realistic market prices based on location
      return this.generateRealisticPrices(state, district);
    } catch (error) {
      console.error("Market service error:", error);
      return this.generateRealisticPrices(state, district);
    }
  }

  private generateRealisticPrices(state: string, district: string): MarketPrice[] {
    const baseDate = new Date().toISOString().split('T')[0];
    
    // Base prices vary by region
    const regionalMultiplier = this.getRegionalMultiplier(state);
    
    const commodities = [
      { name: "Rice", variety: "PR 106", basePrice: 2000, unit: "quintal" },
      { name: "Wheat", variety: "HD 2967", basePrice: 2200, unit: "quintal" },
      { name: "Cotton", variety: "BT Cotton", basePrice: 5500, unit: "quintal" },
      { name: "Sugarcane", variety: "Co 86032", basePrice: 320, unit: "quintal" },
      { name: "Soybean", variety: "JS 335", basePrice: 4000, unit: "quintal" },
      { name: "Maize", variety: "Pioneer", basePrice: 1800, unit: "quintal" },
      { name: "Onion", variety: "Nashik Red", basePrice: 1500, unit: "quintal" },
      { name: "Tomato", variety: "Hybrid", basePrice: 2500, unit: "quintal" },
      { name: "Potato", variety: "Kufri Jyoti", basePrice: 1200, unit: "quintal" },
      { name: "Turmeric", variety: "Salem", basePrice: 8000, unit: "quintal" }
    ];

    return commodities.map((commodity, index) => {
      const basePrice = commodity.basePrice * regionalMultiplier;
      const priceVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const currentPrice = Math.round(basePrice * (1 + priceVariation));
      const previousPrice = Math.round(basePrice);
      const change = currentPrice - previousPrice;
      const changePercent = ((change / previousPrice) * 100);

      return {
        id: `${commodity.name.toLowerCase()}-${index}`,
        commodity: commodity.name,
        variety: commodity.variety,
        market: `${district} Mandi`,
        district: district || 'Unknown',
        state: state || 'Unknown',
        price: currentPrice,
        unit: commodity.unit,
        date: baseDate,
        change,
        changePercent: Math.round(changePercent * 100) / 100
      };
    });
  }

  private getRegionalMultiplier(state: string): number {
    const stateMultipliers: { [key: string]: number } = {
      'maharashtra': 1.1,
      'punjab': 1.05,
      'haryana': 1.05,
      'uttar-pradesh': 0.95,
      'gujarat': 1.08,
      'rajasthan': 0.98,
      'tamil-nadu': 1.12,
      'karnataka': 1.06,
      'andhra-pradesh': 1.04,
      'telangana': 1.04,
      'west-bengal': 0.92,
      'bihar': 0.88,
      'odisha': 0.90
    };
    
    return stateMultipliers[state?.toLowerCase()] || 1.0;
  }

  async getPriceHistory(commodity: string, market: string, days: number = 30): Promise<any> {
    const prices = [];
    const basePrice = 2000 + Math.random() * 3000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      prices.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(basePrice + (Math.random() - 0.5) * 500)
      });
    }

    return {
      commodity,
      market,
      prices
    };
  }
}

export const marketService = new MarketService();