
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
  quotationId?: string;
  senderStopId?: string;
  recipientStopId?: string;
  orderId?: string;
  trackingId?: string;
  status?: string;
}

export interface TrackingResult {
  status: string;
  driverInfo?: {
    name?: string;
    phone?: string;
    photo?: string;
  };
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  estimatedDeliveryTime?: string;
  description?: string;
}

export const useShipping = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);

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

  const trackShipment = async (trackingId: string) => {
    setLoading(true);
    setError(null);
    setTrackingResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('shipping', {
        body: {
          action: 'track-shipment',
          shippingData: {
            trackingId
          },
        },
      });

      if (error) throw new Error(error.message);
      
      // Process and format the tracking data
      const trackingData: TrackingResult = {
        status: data.status || 'unknown',
        driverInfo: data.driver || {},
        location: data.location || {},
        estimatedDeliveryTime: data.eta || '',
        description: data.description || ''
      };

      setTrackingResult(trackingData);
      return trackingData;
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
    trackingResult,
    loading,
    error,
  };
};
