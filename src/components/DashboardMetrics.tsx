
import { StatCard } from "@/components/ui/stat-card";
import { Package, Map, Truck, MapPin } from "lucide-react";

export default function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Active Shipments"
        value="124"
        description="12 pending approval"
        icon={<Package size={20} />}
        trend={{ value: 12, isPositive: true }}
      />
      
      <StatCard
        title="Routes Optimized"
        value="28"
        description="Today's optimized delivery routes"
        icon={<Map size={20} />}
        trend={{ value: 6, isPositive: true }}
      />
      
      <StatCard
        title="Fleet Status"
        value="18/20"
        description="Vehicles currently active"
        icon={<Truck size={20} />}
        className="sm:col-span-1"
      />
      
      <StatCard
        title="Delivery Performance"
        value="98.2%"
        description="On-time delivery rate"
        icon={<MapPin size={20} />}
        trend={{ value: 0.5, isPositive: true }}
      />
    </div>
  );
}
