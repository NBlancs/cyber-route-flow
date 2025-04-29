import { useState, useEffect } from "react";
import { Package, CreditCard, RefreshCcw, AlertCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  credit_limit: number;
  credit_used: number;
  active_shipments?: number;
  credit_status?: 'good' | 'warning' | 'exceeded';
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { createPaymentIntent, loading: paymentLoading } = usePaymentGateway();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch customers from the database
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) {
        throw customersError;
      }

      // Count active shipments for each customer using separate queries
      const activeShipmentsPromises = customersData.map(async (customer) => {
        const { count, error } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .neq('status', 'delivered')
          .neq('status', 'failed');
          
        return {
          customerId: customer.id,
          count: count || 0,
          error
        };
      });
      
      const shipmentCounts = await Promise.all(activeShipmentsPromises);

      // Build a map of customer_id to shipment count
      const shipmentCountMap = new Map();
      shipmentCounts.forEach(item => {
        if (!item.error) {
          shipmentCountMap.set(item.customerId, item.count);
        }
      });

      // Format customers with additional data
      const formattedCustomers = customersData.map(customer => {
        const creditPercentage = (customer.credit_used / customer.credit_limit) * 100;
        let creditStatus: 'good' | 'warning' | 'exceeded' = 'good';
        
        if (creditPercentage >= 100) {
          creditStatus = 'exceeded';
        } else if (creditPercentage >= 80) {
          creditStatus = 'warning';
        }
        
        return {
          ...customer,
          location: `${customer.city || ''}, ${customer.state || ''}`,
          active_shipments: shipmentCountMap.get(customer.id) || 0,
          credit_status: creditStatus
        };
      });

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Could not load customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  // Using mock data if the database is empty
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      active_shipments: 5,
      credit_status: 'good',
      credit_limit: 50000,
      credit_used: 20000,
    },
    {
      id: '2',
      name: 'Global Systems',
      location: 'Austin, TX',
      active_shipments: 3,
      credit_status: 'warning',
      credit_limit: 30000,
      credit_used: 25000,
    },
    {
      id: '3',
      name: 'Quantum Industries',
      location: 'Chicago, IL',
      active_shipments: 7,
      credit_status: 'exceeded',
      credit_limit: 40000,
      credit_used: 41000,
    },
  ];

  const displayCustomers = customers.length > 0 ? customers : mockCustomers;

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
          {displayCustomers.map((customer) => (
            <CustomerCard 
              key={customer.id} 
              customer={customer} 
              onRequestPayment={handlePaymentRequest}
              paymentLoading={paymentLoading}
            />
          ))}

          {displayCustomers.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center text-gray-400">
              <AlertCircle size={24} className="mb-2" />
              <p>No customers found</p>
              <Button variant="outline" size="sm" className="mt-4">
                <Plus size={14} className="mr-2" /> Add Customer
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CustomerCardProps {
  customer: Customer;
  onRequestPayment: (customer: Customer) => void;
  paymentLoading: boolean;
}

function CustomerCard({ customer, onRequestPayment, paymentLoading }: CustomerCardProps) {
  // Calculate credit percentage used
  const creditPercentage = (customer.credit_used / customer.credit_limit) * 100;
  
  // Determine status color
  const statusColor = {
    'good': 'bg-green-500',
    'warning': 'bg-yellow-500',
    'exceeded': 'bg-red-500'
  }[customer.credit_status || 'good'];
  
  return (
    <div className="bg-white/5 border border-gray-800/60 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-white">{customer.name}</h3>
          <p className="text-gray-400 text-sm">{customer.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyber-neon text-sm">{customer.active_shipments}</span>
          <span className="text-xs text-gray-400">shipments</span>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Credit Limit: ${(customer.credit_limit / 1000).toFixed(1)}k</span>
          <span className={creditPercentage >= 100 ? 'text-red-400' : 'text-gray-400'}>
            ${(customer.credit_used / 1000).toFixed(1)}k used
          </span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${statusColor}`} 
            style={{ width: `${Math.min(creditPercentage, 100)}%` }}
          ></div>
        </div>

        {creditPercentage >= 90 && (
          <div className="mt-3 flex justify-end">
            <Button 
              size="sm"
              variant="ghost"
              className="text-xs h-8"
              onClick={() => onRequestPayment(customer)}
              disabled={paymentLoading}
            >
              <CreditCard size={14} className="mr-1" /> 
              Request Payment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
