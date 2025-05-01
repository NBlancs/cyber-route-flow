
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentData {
  amount: number;
  description: string;
  paymentMethodId?: string;
  paymentIntentId?: string;
  returnUrl?: string;
  customerId?: string;
}

interface PaymentResponse {
  data?: {
    checkoutUrl?: string;
    paymentIntentId?: string;
    amount?: number;
    customerId?: string;
  };
  status?: string;
  message?: string;
  paymentDetails?: {
    status: string;
    amount: number;
    customerId: string;
    paymentIntentId: string;
    updated: boolean;
  };
}

export const usePaymentGateway = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createPaymentIntent = async (paymentData: PaymentData): Promise<PaymentResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('payment-gateway', {
        body: {
          action: 'create-payment-intent',
          paymentData,
        },
      });

      if (error) {
        toast({
          title: "Payment Error",
          description: error.message || "Failed to create payment",
          variant: "destructive",
        });
        throw new Error(error.message);
      }
      
      console.log("Payment intent created:", data);
      
      // If payment was processed successfully in test mode, show a success toast
      if (data.paymentDetails?.updated) {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully (test mode)",
        });
      }
      
      return data as PaymentResponse;
    } catch (err: any) {
      setError(err.message || 'Failed to create payment intent');
      toast({
        title: "Payment Error",
        description: err.message || "Failed to create payment",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentData: PaymentData): Promise<PaymentResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log("Confirming payment with data:", paymentData);
      
      const { data, error } = await supabase.functions.invoke('payment-gateway', {
        body: {
          action: 'confirm-payment',
          paymentData,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      console.log("Payment confirmation response:", data);
      
      if (data && data.paymentDetails?.updated) {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully",
        });
      } else if (data && data.status === "pending") {
        toast({
          title: "Payment Processing",
          description: "Your payment is being processed",
        });
      }
      
      return data as PaymentResponse;
    } catch (err: any) {
      setError(err.message || 'Failed to confirm payment');
      toast({
        title: "Payment Error",
        description: err.message || "Failed to confirm payment",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentIntentId: string): Promise<PaymentResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log("Checking payment status for:", paymentIntentId);
      
      const { data, error } = await supabase.functions.invoke('payment-gateway', {
        body: {
          action: 'check-payment-status',
          paymentData: { paymentIntentId },
        },
      });

      if (error) throw new Error(error.message);
      
      console.log("Payment status response:", data);
      return data as PaymentResponse;
    } catch (err: any) {
      setError(err.message || 'Failed to check payment status');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const processWebhook = async (webhookData: any) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('payment-gateway', {
        body: {
          action: 'handle-webhook',
          paymentData: webhookData,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to process webhook');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPaymentIntent,
    confirmPayment,
    checkPaymentStatus,
    processWebhook,
    loading,
    error,
  };
};
