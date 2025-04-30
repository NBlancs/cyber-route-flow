
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Truck, MapPin } from "lucide-react";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export function ShipmentTableRow({ shipment, onTrack, isTracking, actions }: ShipmentTableRowProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleTrackClick = () => {
    onTrack(shipment.tracking_id);
    setShowTooltip(true);
    
    // Auto-hide tooltip after 5 seconds
    setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
  };

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
        <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost"
              className="text-xs h-8"
              onClick={handleTrackClick}
              disabled={isTracking}
            >
              <Truck size={14} className="mr-1" /> Track
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-black border border-cyber-neon p-3">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-cyber-neon" />
              <span>Tracking request sent. Check the notification for location.</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </td>
      {actions && (
        <td className="py-3">
          {actions}
        </td>
      )}
    </tr>
  );
}
