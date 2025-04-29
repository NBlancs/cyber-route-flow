
import React from "react";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";

export interface Shipment {
  id: string;
  tracking_id: string;
  customer_id: string;
  origin: string;
  destination: string;
  status: 'processing' | 'in-transit' | 'delivered' | 'failed';
  eta: string;
  customer_name?: string;
}

interface ShipmentTableRowProps {
  shipment: Shipment;
  onTrack: (trackingId: string) => void;
  isTracking: boolean;
  actions?: React.ReactNode;
}

export function ShipmentTableRow({ shipment, onTrack, isTracking }: ShipmentTableRowProps) {
  return (
    <tr className="text-sm border-b border-gray-800/50 hover:bg-white/5">
      <td className="py-3 text-cyber-neon">{shipment.tracking_id}</td>
      <td className="py-3">{shipment.customer_name}</td>
      <td className="py-3 text-xs">
        <div className="flex flex-col">
          <span className="text-gray-400">From: {shipment.origin}</span>
          <span className="text-white">To: {shipment.destination}</span>
        </div>
      </td>
      <td className="py-3">
        <ShipmentStatusBadge status={shipment.status} />
      </td>
      <td className="py-3">{shipment.eta}</td>
      <td className="py-3">
        <Button 
          size="sm" 
          variant="ghost"
          className="text-xs h-8"
          onClick={() => onTrack(shipment.tracking_id)}
          disabled={isTracking}
        >
          <Truck size={14} className="mr-1" /> Track
        </Button>
      </td>
    </tr>
  );
}
