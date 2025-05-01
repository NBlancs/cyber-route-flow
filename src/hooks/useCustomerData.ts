
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "@/types/customer";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";

export function useCustomerData() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { confirmPayment, checkPaymentStatus } = usePaymentGateway();

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

  // Handle payment confirmation via URL parameters
  useEffect(() => {
    const handlePaymentReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      const paymentId = urlParams.get('payment_id');
      
      if (paymentId) {
        console.log("Detected payment return. Status:", paymentStatus, "Payment ID:", paymentId);
        
        if (paymentStatus === 'success' || paymentStatus === 'pending') {
          try {
            // First check payment status
            const statusResult = await checkPaymentStatus(paymentId);
            console.log("Payment status check result:", statusResult);
            
            // Now confirm the payment with PayMongo
            const result = await confirmPayment({
              paymentIntentId: paymentId,
              amount: statusResult?.amount || 0,
              customerId: statusResult?.customerId,
              description: "Payment confirmation"
            });
            
            if (result && result.paymentDetails?.updated) {
              console.log("Payment updated successfully:", result);
              // Show success toast
              toast({
                title: "Payment Processed",
                description: "Your payment has been processed and credit has been updated.",
              });
              // Refresh customer data to show updated credit information
              fetchCustomers();
            } else {
              console.log("Payment confirmation received but no update needed:", result);
              toast({
                title: "Payment Processing",
                description: "Your payment is being processed.",
              });
              // Still refresh to show latest data
              fetchCustomers();
            }
          } catch (error) {
            console.error("Error confirming payment:", error);
            toast({
              title: "Payment Update Error",
              description: "There was an issue updating the payment status.",
              variant: "destructive",
            });
          }
        } else if (paymentStatus === 'failed') {
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed",
            variant: "destructive",
          });
        }
        
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    handlePaymentReturn();
    // Only run this once when component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch customers on initial load
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Using mock data if the database is empty
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'TechCorp Inc.',
      email: 'contact@techcorp.com',
      phone: '+63 9123456789',
      location: 'San Francisco, CA',
      city: 'San Francisco',
      state: 'CA',
      active_shipments: 5,
      credit_status: 'good',
      credit_limit: 50000,
      credit_used: 20000,
    },
    {
      id: '2',
      name: 'Global Systems',
      email: 'info@globalsys.com',
      phone: '+63 9223456789',
      location: 'Austin, TX',
      city: 'Austin',
      state: 'TX',
      active_shipments: 3,
      credit_status: 'warning',
      credit_limit: 30000,
      credit_used: 25000,
    },
    {
      id: '3',
      name: 'Quantum Industries',
      email: 'sales@quantum.com',
      phone: '+63 9323456789',
      location: 'Chicago, IL',
      city: 'Chicago',
      state: 'IL',
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
