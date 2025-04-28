
import DashboardLayout from "@/components/layout/DashboardLayout";
import ShipmentTracker from "@/components/ShipmentTracker";

export default function ShipmentsPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Shipments</h1>
        <p className="text-gray-400">Track and manage all your active shipments</p>
      </div>
      <ShipmentTracker />
    </DashboardLayout>
  );
}
