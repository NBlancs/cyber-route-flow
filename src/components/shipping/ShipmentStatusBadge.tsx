
import React from "react";

export interface ShipmentStatusProps {
  status: 'processing' | 'in-transit' | 'delivered' | 'failed';
}

export function ShipmentStatusBadge({ status }: ShipmentStatusProps) {
  const statusConfig = {
    'processing': {
      label: 'Processing',
      className: 'bg-yellow-500/20 text-yellow-300',
    },
    'in-transit': {
      label: 'In Transit',
      className: 'bg-blue-500/20 text-blue-300',
    },
    'delivered': {
      label: 'Delivered',
      className: 'bg-green-500/20 text-green-300',
    },
    'failed': {
      label: 'Failed',
      className: 'bg-red-500/20 text-red-300',
    },
  };

  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${config.className}`}>
      {config.label}
    </span>
  );
}
