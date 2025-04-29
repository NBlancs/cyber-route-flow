
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ShipmentTracker from "@/components/ShipmentTracker";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShipmentData } from "@/hooks/useShipmentData";

export default function ShipmentsPage() {
  const { shipments } = useShipmentData();
  
  // Count shipments by status
  const inTransitCount = shipments.filter(s => s.status === 'in-transit').length;
  const processingCount = shipments.filter(s => s.status === 'processing').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;
  
  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Shipments</h1>
            <p className="text-gray-400">Track and manage all your active shipments</p>
          </div>
          <Button>
            <Plus size={16} className="mr-1" /> Create Shipment
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{deliveredCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <ShipmentTracker />
    </DashboardLayout>
  );
}
