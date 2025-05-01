
import { useState, useEffect } from "react";
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
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAmount("100.00");
      setProcessingPayment(false);
    }
  }, [open]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (processingPayment || loading) return; // Prevent multiple submissions
    
    setProcessingPayment(true);
    
    try {
      // Create a payment intent
      const parsedAmount = parseFloat(amount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }
      
      const paymentData = {
        amount: parsedAmount,
        description: `Payment from ${customer.name}`,
        returnUrl: window.location.origin + "/customers",
        customerId: customer.id,
      };
      
      console.log("Creating payment with data:", paymentData);
      const result = await createPaymentIntent(paymentData);
      
      if (result && result.data && result.data.checkoutUrl) {
        // Close the modal before redirecting
        onClose();
        
        // If in test mode and the credit has been updated already, show a success toast
        if (result.paymentDetails?.updated) {
          toast({
            title: "Payment Processed (Test Mode)",
            description: "Your payment has been processed and customer credit has been updated.",
          });
          
          // Trigger success callback to refresh customer data
          if (onSuccess) {
            onSuccess();
          }
        } else {
          // Show a processing toast
          toast({
            title: "Payment Processing",
            description: "Your payment is being processed. Redirecting to payment gateway...",
          });
          
          // Small delay to allow the toast to be seen
          setTimeout(() => {
            // Redirect to the payment checkout URL in a new tab
            window.open(result.data.checkoutUrl, "_blank");
            
            // After a short delay, trigger refresh of customer data anyway
            setTimeout(() => {
              if (onSuccess) {
                onSuccess();
              }
            }, 1000);
          }, 1000);
        }
      } else {
        throw new Error("Failed to create payment checkout URL");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Could not process payment request",
        variant: "destructive",
      });
      setProcessingPayment(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !processingPayment) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border border-gray-800 text-white">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Process Payment</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            disabled={processingPayment || loading}
          >
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
                  Payment Amount (PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">₱</span>
                  <input
                    id="amount"
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md pl-8 pr-4 py-2 focus:ring-cyber-neon focus:border-cyber-neon focus:outline-none"
                    disabled={processingPayment || loading}
                  />
                </div>
              </div>
              
              <div className="pt-2 flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={processingPayment || loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={processingPayment || loading}
                >
                  {processingPayment || loading ? "Processing..." : "Process Payment"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
