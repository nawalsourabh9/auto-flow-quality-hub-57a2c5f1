
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "primary";
}

export function StatCard({ 
  title,
  value, 
  description,
  icon: Icon,
  trend,
  variant = "default"
}: StatCardProps) {
  const variantClassMap = {
    default: "bg-white",
    success: "bg-green-50 border-green-100",
    warning: "bg-amber-50 border-amber-100",
    danger: "bg-red-50 border-red-100",
    primary: "bg-blue-50 border-blue-100"
  };
  
  const iconClassMap = {
    default: "text-eqms-blue bg-blue-50",
    success: "text-green-600 bg-green-100",
    warning: "text-amber-600 bg-amber-100",
    danger: "text-red-600 bg-red-100",
    primary: "text-blue-600 bg-blue-100"
  };

  return (
    <Card className={cn("border shadow-sm", variantClassMap[variant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-full", iconClassMap[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend && (
              <span 
                className={cn(
                  "mr-1 font-medium",
                  trend.positive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
