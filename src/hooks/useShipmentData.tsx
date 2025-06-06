
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useShipping, TrackingResult } from "@/hooks/useShipping";
import { Shipment } from "@/components/shipping/ShipmentTableRow";
import { formatShippingEta } from "@/utils/formatShippingEta";

export function useShipmentData() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [currentTrackingInfo, setCurrentTrackingInfo] = useState<TrackingResult | null>(null);
  const { toast } = useToast();
  const { trackShipment } = useShipping();

  // Mock shipments data for when database is empty
  const mockShipments: Shipment[] = [
    {
      id: '1',
      tracking_id: 'LAL-12345',
      customer_id: '1',
      origin: 'Makati, PH',
      destination: 'Manila, PH',
      status: 'in-transit',
      eta: '3h 45m',
      customer_name: 'TechCorp Inc.'
    },
    {
      id: '2',
      tracking_id: 'LAL-12346',
      customer_id: '2',
      origin: 'Taguig, PH',
      destination: 'Quezon City, PH',
      status: 'processing',
      eta: 'Pending',
      customer_name: 'Global Systems'
    },
    {
      id: '3',
      tracking_id: 'LAL-12347',
      customer_id: '3',
      origin: 'Pasig, PH',
      destination: 'Alabang, PH',
      status: 'delivered',
      eta: 'Delivered',
      customer_name: 'Quantum Industries'
    },
    {
      id: '4',
      tracking_id: 'LAL-12348',
      customer_id: '4',
      origin: 'Mandaluyong, PH',
      destination: 'Pasay, PH',
      status: 'in-transit',
      eta: '1d 2h',
      customer_name: 'Future Dynamics'
    },
  ];

  const fetchShipments = async () => {
    setLoading(true);
    try {
      // Fetch shipments from the database
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select('*, customers(name)')
        .order('created_at', { ascending: false });

      if (shipmentsError) {
        throw shipmentsError;
      }

      // Format the data
      const formattedShipments = shipmentsData.map(shipment => ({
        id: shipment.id,
        tracking_id: shipment.tracking_id,
        customer_id: shipment.customer_id,
        origin: shipment.origin,
        destination: shipment.destination,
        status: (shipment.status || 'processing') as 'processing' | 'in-transit' | 'delivered' | 'failed',
        eta: formatShippingEta(shipment.eta),
        customer_name: shipment.customers?.name || 'Unknown Customer'
      }));

      setShipments(formattedShipments);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      toast({
        title: "Error",
        description: "Could not load shipments data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrackShipment = async (trackingId: string) => {
    setTrackingLoading(true);
    try {
      const result = await trackShipment(trackingId);
      
      if (result) {
        setCurrentTrackingInfo(result);
        
        // Display tracking information
        const locationText = result.location ? 
          `at ${result.location.address || 'current location'}` : 
          '';

        const driverText = result.driverInfo && result.driverInfo.name ? 
          `Driver: ${result.driverInfo.name}` : 
          '';

        const etaText = result.estimatedDeliveryTime ? 
          `ETA: ${result.estimatedDeliveryTime}` : 
          '';
          
        toast({
          title: `Tracking Status: ${result.status}`,
          description: `${locationText} ${driverText} ${etaText}`.trim() || 'No additional details available',
          duration: 5000,
        });
        
        // Refresh shipments to show updated tracking status
        fetchShipments();
      }
    } catch (error) {
      console.error("Error tracking shipment:", error);
      toast({
        title: "Tracking Failed",
        description: "Could not retrieve tracking information",
        variant: "destructive",
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  return {
    shipments: shipments.length > 0 ? shipments : mockShipments,
    loading,
    trackingLoading,
    currentTrackingInfo,
    fetchShipments,
    handleTrackShipment,
  };
}
