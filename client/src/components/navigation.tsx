import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, User, FileText, CloudSun, TrendingUp } from "lucide-react";

const navigationItems = [
  { 
    path: "/dashboard", 
    label: "Dashboard", 
    icon: LayoutDashboard,
    testId: "nav-dashboard"
  },
  { 
    path: "/profile", 
    label: "Profile", 
    icon: User,
    testId: "nav-profile"
  },
  { 
    path: "/schemes", 
    label: "Schemes", 
    icon: FileText,
    testId: "nav-schemes"
  },
  { 
    path: "/weather", 
    label: "Weather", 
    icon: CloudSun,
    testId: "nav-weather"
  },
  { 
    path: "/market", 
    label: "Market", 
    icon: TrendingUp,
    testId: "nav-market"
  }
];

export default function Navigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm" data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {navigationItems.map(item => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => setLocation(item.path)}
                className={`flex items-center space-x-2 px-3 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'border-primary text-primary font-medium' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
                data-testid={item.testId}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
