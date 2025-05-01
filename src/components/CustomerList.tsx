
import { Package, RefreshCcw, Pencil, Trash } from "lucide-react";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CustomerCard } from "@/components/customers/CustomerCard";
import { EmptyCustomerState } from "@/components/customers/EmptyCustomerState";
import { useCustomerData } from "@/hooks/useCustomerData";
import { Customer } from "@/types/customer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CustomerListProps = {
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
};

export default function CustomerList({ onEdit, onDelete }: CustomerListProps) {
  const { customers, loading, fetchCustomers } = useCustomerData();
  const { toast } = useToast();
  const { createPaymentIntent, loading: paymentLoading } = usePaymentGateway();

  const handlePaymentRequest = async (customer: Customer) => {
    try {
      // Create a payment intent for the customer
      const result = await createPaymentIntent({
        amount: 100, // $1.00
        description: `Credit increase for ${customer.name}`,
        returnUrl: window.location.origin + "/customers",
        customerId: customer.id,
      });
      
      if (result) {
        toast({
          title: "Payment Request Sent",
          description: "The customer has been notified about the payment request",
        });
        
        // Refresh customer data after payment is created
        fetchCustomers();
      }
    } catch (error) {
      toast({
        title: "Payment Request Failed",
        description: "Could not create payment request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="cyber-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package size={18} className="text-cyber-neon" />
          <span>Top Customers</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchCustomers} 
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
          <span className="ml-2">Loading customers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {customers.map((customer) => (
            <div key={customer.id} className="relative">
              {(onEdit || onDelete) && (
                <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(customer)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(customer)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <CustomerCard 
                customer={customer} 
                onRequestPayment={handlePaymentRequest}
                paymentLoading={paymentLoading}
              />
            </div>
          ))}

          {customers.length === 0 && <EmptyCustomerState />}
        </div>
      )}
    </div>
  );
}
