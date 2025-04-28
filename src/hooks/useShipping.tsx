
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Address {
  company: string;
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface ShippingData {
  toAddress?: Address;
  fromAddress?: Address;
  parcel?: Parcel;
  options?: Record<string, any>;
  shipmentId?: string;
  rateId?: string;
  trackingCode?: string;
  carrier?: string;
}

export const useShipping = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createShipment = async (shippingData: ShippingData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('shipping', {
        body: {
          action: 'create-shipment',
          shippingData,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to create shipment');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const buyShipment = async (shippingData: ShippingData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('shipping', {
        body: {
          action: 'buy-shipment',
          shippingData,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to buy shipment');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const trackShipment = async (shippingData: ShippingData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('shipping', {
        body: {
          action: 'track-shipment',
          shippingData,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to track shipment');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createShipment,
    buyShipment,
    trackShipment,
    loading,
    error,
  };
};
