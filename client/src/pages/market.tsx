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
  TrendingUp, 
  TrendingDown, 
  Minus,
  IndianRupee,
  Calendar,
  MapPin,
  Wheat,
  AlertTriangle
} from "lucide-react";

interface MarketPrice {
  id: string;
  commodity: string;
  variety?: string;
  unit: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  market: string;
  date: string;
  trend: 'up' | 'down' | 'stable';
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
    default: return <Minus className="w-4 h-4 text-gray-500" />;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up': return 'text-green-600 dark:text-green-400';
    case 'down': return 'text-red-600 dark:text-red-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
};

const getTrendBadgeVariant = (trend: string) => {
  switch (trend) {
    case 'up': return 'default';
    case 'down': return 'destructive';
    default: return 'secondary';
  }
};

export default function Market() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Fetch market prices
  const { data: marketPrices, isLoading, error } = useQuery({
    queryKey: ["/api/market/prices"],
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  }) as { data: MarketPrice[], isLoading: boolean, error: any };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
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
              Failed to load market prices. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // Group prices by commodity type
  const groupedPrices = marketPrices?.reduce((acc, price) => {
    const category = price.commodity.toLowerCase().includes('rice') ? 'Rice' :
                    price.commodity.toLowerCase().includes('wheat') ? 'Wheat' :
                    price.commodity.toLowerCase().includes('cotton') ? 'Cotton' :
                    price.commodity.toLowerCase().includes('sugarcane') ? 'Sugarcane' :
                    price.commodity.toLowerCase().includes('soybean') ? 'Pulses & Oilseeds' :
                    price.commodity.toLowerCase().includes('maize') ? 'Coarse Cereals' :
                    'Other Crops';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(price);
    return acc;
  }, {} as Record<string, MarketPrice[]>) || {};

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Market Prices
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Current market prices for agricultural commodities
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>

        {marketPrices && marketPrices.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedPrices).map(([category, prices]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Wheat className="w-5 h-5" />
                  <span>{category}</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prices.map((price) => (
                    <Card key={price.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{price.commodity}</CardTitle>
                          <Badge variant={getTrendBadgeVariant(price.trend) as any}>
                            {getTrendIcon(price.trend)}
                          </Badge>
                        </div>
                        {price.variety && (
                          <CardDescription>{price.variety}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Current Price */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
                          <div className="flex items-center space-x-1">
                            <IndianRupee className="w-4 h-4" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              {price.price.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500">/{price.unit}</span>
                          </div>
                        </div>
                        
                        {/* Price Change */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Change</span>
                          <div className={`flex items-center space-x-1 ${getTrendColor(price.trend)}`}>
                            {getTrendIcon(price.trend)}
                            <span className="font-medium">
                              ₹{Math.abs(price.change)} ({price.changePercent > 0 ? '+' : ''}{price.changePercent.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {/* Market Location */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Market</span>
                          <div className="flex items-center space-x-1 text-sm">
                            <MapPin className="w-3 h-3" />
                            <span>{price.market}</span>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
                          <div className="flex items-center space-x-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(price.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">No Market Data Available</div>
                <div className="text-sm">
                  Market price information is currently unavailable. Please check back later or contact support if this issue persists.
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Market Information */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Market Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Price Trends</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• <TrendingUp className="w-3 h-3 inline text-green-500" /> Green indicates price increase</li>
                <li>• <TrendingDown className="w-3 h-3 inline text-red-500" /> Red indicates price decrease</li>
                <li>• <Minus className="w-3 h-3 inline text-gray-500" /> Gray indicates stable prices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Data Sources</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• AGMARKNET portal data</li>
                <li>• eNAM platform prices</li>
                <li>• Local mandi rates</li>
                <li>• Updated every 4 hours</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}