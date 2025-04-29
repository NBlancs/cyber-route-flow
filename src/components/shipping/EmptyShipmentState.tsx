
import React from "react";
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyShipmentStateProps = {
  onAdd?: () => void;
};

export function EmptyShipmentState({ onAdd }: EmptyShipmentStateProps) {
  if (onAdd) {
    return (
      <tr>
        <td colSpan={6} className="py-8 text-center">
          <div className="flex flex-col items-center justify-center text-gray-400">
            <AlertCircle size={24} className="mb-2" />
            <p>No shipments found</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onAdd}>
              <Plus size={14} className="mr-2" /> Create Shipment
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={6} className="py-8 text-center">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <AlertCircle size={24} className="mb-2" />
          <p>No shipments found</p>
        </div>
      </td>
    </tr>
  );
}
