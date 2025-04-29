
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardMetrics from "@/components/DashboardMetrics";
import DeliveryMap from "@/components/DeliveryMap";
import ShipmentTracker from "@/components/ShipmentTracker";
import CustomerList from "@/components/CustomerList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShipmentData } from "@/hooks/useShipmentData";
import { useCustomerData } from "@/hooks/useCustomerData";

const Index = () => {
  const { shipments } = useShipmentData();
  const { customers } = useCustomerData();
  
  // Calculate summary metrics
  const inTransitCount = shipments.filter(s => s.status === 'in-transit').length;
  const activeCustomers = customers.filter(c => c.active_shipments && c.active_shipments > 0).length;
  const overdueCustomers = customers.filter(c => c.credit_status === 'exceeded').length;

  return (
    <DashboardLayout>
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Logistics Dashboard</h1>
        <p className="text-gray-400">Monitor your shipments, optimize routes and track delivery performance</p>
      </div>
      
      {/* Metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{overdueCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments.length}</div>
          </CardContent>
        </Card>
      </div>
      
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
