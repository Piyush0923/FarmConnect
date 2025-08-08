import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { File, DollarSign, Map, Leaf, TrendingUp, TrendingDown } from "lucide-react";

interface DashboardStatsProps {
  stats?: {
    activeSchemes: number;
    totalBenefits: number;
    totalLandArea: number;
    activeCrops: number;
  };
  isLoading: boolean;
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  const statsCards = [
    {
      title: "Active Schemes",
      value: stats?.activeSchemes ?? 0,
      icon: File,
      color: "border-primary",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      change: "+2 new",
      changeType: "positive" as const,
      testId: "stat-active-schemes"
    },
    {
      title: "Benefits Received",
      value: formatCurrency(stats?.totalBenefits ?? 0),
      icon: DollarSign,
      color: "border-secondary",
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary",
      change: "+15%",
      changeType: "positive" as const,
      testId: "stat-benefits"
    },
    {
      title: "Land Area",
      value: `${stats?.totalLandArea ?? 0} acres`,
      icon: Map,
      color: "border-accent",
      bgColor: "bg-accent/10",
      iconColor: "text-accent",
      change: "3 plots registered",
      changeType: "neutral" as const,
      testId: "stat-land-area"
    },
    {
      title: "Active Crops",
      value: stats?.activeCrops ?? 0,
      icon: Leaf,
      color: "border-success",
      bgColor: "bg-success/10",
      iconColor: "text-success",
      change: "Current season",
      changeType: "neutral" as const,
      testId: "stat-active-crops"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <div className="mt-4 flex items-center">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20 ml-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((card) => {
        const Icon = card.icon;
        
        return (
          <Card key={card.title} className={`group border-l-4 ${card.color} hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 cursor-pointer`} data-testid={card.testId}>
            <CardContent className="pt-6 relative overflow-hidden">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-full group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                  <Icon className={`${card.iconColor} text-xl h-6 w-6 group-hover:scale-110 transition-transform duration-300`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm relative z-10">
                {card.changeType === 'positive' ? (
                  <span className="text-success flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {card.change}
                  </span>
                ) : card.changeType === 'negative' ? (
                  <span className="text-destructive flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    {card.change}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    {card.change}
                  </span>
                )}
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  {card.changeType === 'positive' ? 'this month' :
                   card.changeType === 'negative' ? 'from last year' :
                   ''}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
