
import { Package, RefreshCcw } from "lucide-react";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CustomerCard } from "@/components/customers/CustomerCard";
import { EmptyCustomerState } from "@/components/customers/EmptyCustomerState";
import { useCustomerData } from "@/hooks/useCustomerData";
import { Customer } from "@/types/customer";

export default function CustomerList() {
  const { customers, loading, fetchCustomers } = useCustomerData();
  const { toast } = useToast();
  const { createPaymentIntent, loading: paymentLoading } = usePaymentGateway();

  const handlePaymentRequest = async (customer: Customer) => {
    try {
      // Create a payment intent for the customer
      const result = await createPaymentIntent({
        amount: 100, // $1.00
        description: `Credit increase for ${customer.name}`,
      });
      
      if (result) {
        toast({
          title: "Payment Request Sent",
          description: "The customer has been notified about the payment request",
        });
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
            <CustomerCard 
              key={customer.id} 
              customer={customer} 
              onRequestPayment={handlePaymentRequest}
              paymentLoading={paymentLoading}
            />
          ))}

          {customers.length === 0 && <EmptyCustomerState />}
        </div>
      )}
    </div>
  );
}
