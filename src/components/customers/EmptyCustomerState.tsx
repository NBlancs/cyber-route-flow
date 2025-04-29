
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function EmptyCustomerState() {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-gray-400">
      <AlertCircle size={24} className="mb-2" />
      <p>No customers found</p>
      <Button variant="outline" size="sm" className="mt-4">
        <Plus size={14} className="mr-2" /> Add Customer
      </Button>
      <p className="text-xs mt-4">
        You can add customers or <Link to="/customers" className="text-cyber-neon hover:underline">manage existing ones</Link>
      </p>
    </div>
  );
}
