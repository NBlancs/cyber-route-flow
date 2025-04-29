
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "@/types/customer";

export function useCustomerData() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  useEffect(() => {
    fetchCustomers();
  }, []);

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

  return {
    customers: displayCustomers,
    loading,
    fetchCustomers
  };
}
