import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketPrices() {
  const { data: marketPrices, isLoading, error } = useQuery({
    queryKey: ["/api/market/prices"],
    refetchInterval: 600000, // Refresh every 10 minutes
  }) as { data: any[], isLoading: boolean, error: any };

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Market Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-20 mb-2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !marketPrices) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Market Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8" data-testid="market-prices-error">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Market prices unavailable</p>
            <p className="text-sm text-gray-400 mt-2">
              Please try again later
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriceChangeBadgeColor = (change: number) => {
    if (change > 0) return 'bg-green-100 text-green-800';
    if (change < 0) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="mt-8" data-testid="market-prices-widget">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">Market Prices</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Latest commodity prices in your region</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          Live Data
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketPrices.slice(0, 6).map((commodity: any, index: number) => (
            <div 
              key={index} 
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              data-testid={`market-price-${commodity.id}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{commodity.commodity}</h4>
                <Badge variant="outline" className="text-xs">
                  {commodity.unit}
                </Badge>
              </div>
              
              {commodity.variety && (
                <p className="text-sm text-gray-600 mb-2">{commodity.variety}</p>
              )}
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(commodity.price)}
                </span>
                <div className={`flex items-center text-sm ${getPriceChangeColor(commodity.change)}`}>
                  {commodity.change > 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : commodity.change < 0 ? (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-1" />
                  )}
                  <span>{commodity.changePercent?.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{commodity.market}</span>
                <Badge className={getPriceChangeBadgeColor(commodity.change)}>
                  {commodity.change > 0 ? '+' : ''}{formatPrice(commodity.change)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {marketPrices.length > 6 && (
          <div className="text-center mt-6">
            <Button variant="outline" className="text-accent hover:text-accent/90">
              View All Prices
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}