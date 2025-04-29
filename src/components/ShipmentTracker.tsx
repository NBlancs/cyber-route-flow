import { useState, useEffect } from "react";
import { Package, Truck, RefreshCcw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useShipping } from "@/hooks/useShipping";
import { Button } from "@/components/ui/button";

interface Shipment {
  id: string;
  tracking_id: string;
  customer_id: string;
  origin: string;
  destination: string;
  status: 'processing' | 'in-transit' | 'delivered' | 'failed';
  eta: string;
  customer_name?: string;
}

export default function ShipmentTracker() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { trackShipment, loading: trackingLoading } = useShipping();

  useEffect(() => {
    fetchShipments();
  }, []);

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
        eta: formatEta(shipment.eta),
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

  const formatEta = (etaDate: string | null) => {
    if (!etaDate) return 'Pending';
    
    const eta = new Date(etaDate);
    const now = new Date();
    
    if (eta < now) {
      return 'Delivered';
    }
    
    const diffTime = Math.abs(eta.getTime() - now.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    }
    return `${diffHours}h ${Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60))}m`;
  };

  const handleTrackShipment = async (trackingId: string) => {
    try {
      // Using Lalamove, we need the orderId instead of tracking code and carrier
      const result = await trackShipment({
        orderId: trackingId
      });
      
      if (result) {
        toast({
          title: "Tracking Updated",
          description: `Latest status: ${result.status}`,
        });
        // Refresh shipments to show updated tracking
        fetchShipments();
      }
    } catch (error) {
      toast({
        title: "Tracking Failed",
        description: "Could not retrieve tracking information",
        variant: "destructive",
      });
    }
  };

  // Using mock data if the database is empty
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

  const displayShipments = shipments.length > 0 ? shipments : mockShipments;

  return (
    <div className="cyber-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package size={18} className="text-cyber-neon" />
          <span>Active Shipments</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchShipments} 
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
          <span className="ml-2">Loading shipments...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-800">
                <th className="pb-2 text-left font-medium">Tracking ID</th>
                <th className="pb-2 text-left font-medium">Customer</th>
                <th className="pb-2 text-left font-medium">Route</th>
                <th className="pb-2 text-left font-medium">Status</th>
                <th className="pb-2 text-left font-medium">ETA</th>
                <th className="pb-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayShipments.map((shipment) => (
                <tr 
                  key={shipment.id} 
                  className="text-sm border-b border-gray-800/50 hover:bg-white/5"
                >
                  <td className="py-3 text-cyber-neon">{shipment.tracking_id}</td>
                  <td className="py-3">{shipment.customer_name}</td>
                  <td className="py-3 text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-400">From: {shipment.origin}</span>
                      <span className="text-white">To: {shipment.destination}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <ShipmentStatus status={shipment.status} />
                  </td>
                  <td className="py-3">{shipment.eta}</td>
                  <td className="py-3">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={() => handleTrackShipment(shipment.tracking_id)}
                      disabled={trackingLoading}
                    >
                      <Truck size={14} className="mr-1" /> Track
                    </Button>
                  </td>
                </tr>
              ))}

              {displayShipments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle size={24} className="mb-2" />
                      <p>No shipments found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface ShipmentStatusProps {
  status: 'processing' | 'in-transit' | 'delivered' | 'failed';
}

function ShipmentStatus({ status }: ShipmentStatusProps) {
  const statusConfig = {
    'processing': {
      label: 'Processing',
      className: 'bg-yellow-500/20 text-yellow-300',
    },
    'in-transit': {
      label: 'In Transit',
      className: 'bg-blue-500/20 text-blue-300',
    },
    'delivered': {
      label: 'Delivered',
      className: 'bg-green-500/20 text-green-300',
    },
    'failed': {
      label: 'Failed',
      className: 'bg-red-500/20 text-red-300',
    },
  };

  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${config.className}`}>
      {config.label}
    </span>
  );
}
