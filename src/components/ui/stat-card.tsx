
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "cyber-card p-4 md:p-6 flex flex-col gap-2 animate-float",
      className
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm md:text-base font-medium text-gray-300">{title}</h3>
        {icon && <div className="text-cyber-neon">{icon}</div>}
      </div>
      
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-bold text-white cyber-text-glow">{value}</p>
        
        {trend && (
          <div className="flex items-center gap-1">
            <span className={trend.isPositive ? "text-cyber-neon" : "text-red-400"}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-400">vs. last month</span>
          </div>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}
