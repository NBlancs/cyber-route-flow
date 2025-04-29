
import React from "react";
import { Package, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShipmentTableRow } from "./shipping/ShipmentTableRow";
import { EmptyShipmentState } from "./shipping/EmptyShipmentState";
import { useShipmentData } from "@/hooks/useShipmentData";

export default function ShipmentTracker() {
  const { 
    shipments, 
    loading, 
    trackingLoading, 
    fetchShipments, 
    handleTrackShipment 
  } = useShipmentData();

  return (
    <div className="cyber-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package size={18} className="text-cyber-neon" />
          <span>Active Shipments</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchShipments} 
            disabled={loading}
            className="text-xs"
          >
            <RefreshCcw size={14} className="mr-1" /> Refresh
          </Button>
          <button className="text-xs text-cyber-neon hover:underline">View All</button>
        </div>
      </div>
      
      {loading ? (
        <div className="py-8 flex justify-center items-center">
          <div className="animate-spin">
            <RefreshCcw size={24} />
          </div>
          <span className="ml-2">Loading shipments...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-800">
                <th className="pb-2 text-left font-medium">Tracking ID</th>
                <th className="pb-2 text-left font-medium">Customer</th>
                <th className="pb-2 text-left font-medium">Route</th>
                <th className="pb-2 text-left font-medium">Status</th>
                <th className="pb-2 text-left font-medium">ETA</th>
                <th className="pb-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => (
                <ShipmentTableRow
                  key={shipment.id}
                  shipment={shipment}
                  onTrack={handleTrackShipment}
                  isTracking={trackingLoading}
                />
              ))}

              {shipments.length === 0 && <EmptyShipmentState />}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
