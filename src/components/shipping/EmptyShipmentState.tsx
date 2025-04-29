
import React from "react";
import { AlertCircle } from "lucide-react";

export function EmptyShipmentState() {
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
