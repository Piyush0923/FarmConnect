import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, DollarSign, MapPin, Bookmark, BookmarkCheck, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";

interface SchemeCardProps {
  scheme: any;
  isBookmarked?: boolean;
  isApplied?: boolean;
  applicationStatus?: string;
  onBookmark?: (isBookmarked: boolean) => void;
  onApply?: () => void;
  showMatchPercentage?: boolean;
  "data-testid"?: string;
}

export default function SchemeCard({
  scheme,
  isBookmarked = false,
  isApplied = false,
  applicationStatus,
  onBookmark,
  onApply,
  showMatchPercentage = false,
  "data-testid": testId
}: SchemeCardProps) {
  const getStatusBadge = () => {
    if (!isApplied) return null;

    const statusConfig = {
      pending: { color: 'bg-warning', icon: Clock, text: 'Pending' },
      approved: { color: 'bg-success', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-destructive', icon: XCircle, text: 'Rejected' },
      completed: { color: 'bg-success', icon: CheckCircle, text: 'Completed' },
    };

    const config = statusConfig[applicationStatus as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getMatchPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 75) return 'bg-accent';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const formatBenefitAmount = (amount: any) => {
    if (!amount) return 'Variable';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount >= 100000) {
      return `₹${(numAmount / 100000).toFixed(1)}L`;
    }
    if (numAmount >= 1000) {
      return `₹${(numAmount / 1000).toFixed(1)}K`;
    }
    return `₹${numAmount}`;
  };

  const formatDeadline = (deadline: string) => {
    if (!deadline) return 'Ongoing';
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    return date.toLocaleDateString();
  };

  const isExpiringSoon = (deadline: string) => {
    if (!deadline) return false;
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  return (
    <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-900 dark:to-gray-800/30" data-testid={testId}>
      <CardContent className="p-6 relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/0 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-primary transition-colors duration-300">
                {scheme.name}
              </h3>
              <div className="flex space-x-1">
                {scheme.schemeType === 'central' && (
                  <Badge variant="outline" className="text-xs">Central</Badge>
                )}
                {scheme.schemeType === 'state' && (
                  <Badge variant="outline" className="text-xs">State</Badge>
                )}
                {isExpiringSoon(scheme.deadline) && (
                  <Badge className="bg-warning text-white text-xs">Expiring Soon</Badge>
                )}
                {getStatusBadge()}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {scheme.description}
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
              {scheme.deadline && (
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Deadline: {formatDeadline(scheme.deadline)}
                </span>
              )}
              
              {scheme.benefitAmount && (
                <span className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {formatBenefitAmount(scheme.benefitAmount)}
                </span>
              )}
              
              {scheme.department && (
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {scheme.department}
                </span>
              )}
            </div>
            
            {showMatchPercentage && scheme.matchPercentage && (
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {scheme.matchPercentage}% Match
                </span>
                <Progress 
                  value={scheme.matchPercentage} 
                  className="w-24 h-2"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex space-x-2">
            <Button
              onClick={() => onApply?.()}
              disabled={isApplied}
              className={`${
                isApplied 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl'
              } text-white transition-all duration-300 transform hover:scale-105 ${!isApplied ? 'animate-pulse' : ''}`}
              data-testid={`button-apply-${scheme.id}`}
            >
              {isApplied ? (
                applicationStatus === 'completed' ? 'Completed' : 'Applied'
              ) : (
                'Apply Now'
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onBookmark?.(isBookmarked)}
              className="flex items-center space-x-1 hover:scale-110 transition-all duration-200 border-2 hover:border-primary"
              data-testid={`button-bookmark-${scheme.id}`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-primary scale-110" />
              ) : (
                <Bookmark className="w-4 h-4 hover:text-primary transition-colors" />
              )}
              <span className="hidden sm:inline">
                {isBookmarked ? 'Saved' : 'Save'}
              </span>
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-accent hover:text-accent/90"
            onClick={() => {
              // In a real app, this would open scheme details or external link
              window.open('#', '_blank');
            }}
            data-testid={`button-details-${scheme.id}`}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Details
          </Button>
        </div>
        
        {scheme.eligibilityCriteria && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
              Key Eligibility:
            </p>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(scheme.eligibilityCriteria) ? 
                scheme.eligibilityCriteria.slice(0, 3).map((criteria: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {criteria}
                  </Badge>
                )) : 
                <Badge variant="secondary" className="text-xs">
                  See details for eligibility
                </Badge>
              }
              {Array.isArray(scheme.eligibilityCriteria) && scheme.eligibilityCriteria.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{scheme.eligibilityCriteria.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
