
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyCustomerState() {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-gray-400">
      <AlertCircle size={24} className="mb-2" />
      <p>No customers found</p>
      <Button variant="outline" size="sm" className="mt-4">
        <Plus size={14} className="mr-2" /> Add Customer
      </Button>
    </div>
  );
}
