
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardMetrics from "@/components/DashboardMetrics";
import DeliveryMap from "@/components/DeliveryMap";
import ShipmentTracker from "@/components/ShipmentTracker";
import CustomerList from "@/components/CustomerList";

const Index = () => {
  return (
    <DashboardLayout>
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Logistics Dashboard</h1>
        <p className="text-gray-400">Monitor your shipments, optimize routes and track delivery performance</p>
      </div>
      
      {/* Metrics overview */}
      <DashboardMetrics />
      
      {/* Main content section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map area - takes 2/3 of the space on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <DeliveryMap />
          <ShipmentTracker />
        </div>
        
        {/* Side panel - takes 1/3 of the space */}
        <div className="space-y-6">
          <CustomerList />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
