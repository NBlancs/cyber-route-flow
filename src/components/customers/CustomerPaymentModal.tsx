
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Customer } from "@/types/customer";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { useToast } from "@/hooks/use-toast";

interface CustomerPaymentModalProps {
  customer: Customer;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CustomerPaymentModal({ customer, open, onClose, onSuccess }: CustomerPaymentModalProps) {
  const [amount, setAmount] = useState("100.00");
  const [processingPayment, setProcessingPayment] = useState(false);
  const { createPaymentIntent, loading } = usePaymentGateway();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingPayment(true);
    
    try {
      // Create a payment intent
      const paymentData = {
        amount: parseFloat(amount),
        description: `Payment from ${customer.name}`,
        returnUrl: window.location.origin + "/customers",
        customerId: customer.id,
      };
      
      const result = await createPaymentIntent(paymentData);
      
      if (result && result.data && result.data.checkoutUrl) {
        toast({
          title: "Redirecting to payment gateway",
          description: "You will be redirected to complete the payment",
        });
        
        // Redirect to the payment checkout URL
        window.location.href = result.data.checkoutUrl;
      } else {
        throw new Error("Failed to create payment checkout URL");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: "Could not process payment request",
        variant: "destructive",
      });
      setProcessingPayment(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border border-gray-800 text-white">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Process Payment</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </DialogHeader>
        
        <div className="py-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{customer.name}</h3>
                <p className="text-sm text-gray-400">{customer.email || customer.location}</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium leading-none">
                  Payment Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                  <input
                    id="amount"
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md pl-8 pr-4 py-2 focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose} disabled={processingPayment}>
                  Cancel
                </Button>
                <Button type="submit" disabled={processingPayment || loading}>
                  {processingPayment ? "Processing..." : "Process Payment"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
