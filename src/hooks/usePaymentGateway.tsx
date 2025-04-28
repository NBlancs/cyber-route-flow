
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentData {
  amount: number;
  description: string;
  paymentMethodId?: string;
  paymentIntentId?: string;
  returnUrl?: string;
}

export const usePaymentGateway = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = async (paymentData: PaymentData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('payment-gateway', {
        body: {
          action: 'create-payment-intent',
          paymentData,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to create payment intent');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentData: PaymentData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('payment-gateway', {
        body: {
          action: 'confirm-payment',
          paymentData,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to confirm payment');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPaymentIntent,
    confirmPayment,
    loading,
    error,
  };
};
