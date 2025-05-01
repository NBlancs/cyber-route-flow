
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PAYMONGO_API_URL = "https://api.paymongo.com/v1";
const IS_TEST_ENVIRONMENT = true; // Set to false in production

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, paymentData } = await req.json();
    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    const publicKey = Deno.env.get("PAYMONGO_PUBLIC_KEY");

    if (!secretKey || !publicKey) {
      return new Response(
        JSON.stringify({ error: "PayMongo API keys not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Authorization header with base64 encoded secret key
    const authHeader = `Basic ${btoa(secretKey + ":")}`;

    if (action === "create-payment-intent") {
      try {
        // First create a payment intent
        const paymentIntentResponse = await fetch(`${PAYMONGO_API_URL}/payment_intents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify({
            data: {
              attributes: {
                amount: Math.floor(paymentData.amount * 100), // Convert to smallest currency unit
                payment_method_allowed: ["card", "gcash", "grab_pay"],
                currency: "PHP",
                capture_type: "automatic",
                description: paymentData.description,
                statement_descriptor: "LOGTECHPAY",
                metadata: {
                  customer_id: paymentData.customerId
                }
              }
            }
          })
        });
        
        const paymentIntentData = await paymentIntentResponse.json();
        console.log("Payment intent created:", JSON.stringify(paymentIntentData));
        
        if (!paymentIntentResponse.ok) {
          throw new Error(paymentIntentData.errors?.[0]?.detail || "Failed to create payment intent");
        }
        
        const paymentIntentId = paymentIntentData.data.id;
        const clientKey = paymentIntentData.data.attributes.client_key;
        
        // Then create a payment link
        const timestamp = Date.now();
        const paymentMethodResponse = await fetch(`${PAYMONGO_API_URL}/links`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify({
            data: {
              attributes: {
                amount: Math.floor(paymentData.amount * 100),
                description: paymentData.description,
                currency: "PHP",
                success_url: `${paymentData.returnUrl}?payment_status=success&payment_id=${paymentIntentId}&t=${timestamp}`,
                cancel_url: `${paymentData.returnUrl}?payment_status=failed&payment_id=${paymentIntentId}&t=${timestamp}`,
                reference_number: `order_${timestamp}`,
                metadata: {
                  customer_id: paymentData.customerId,
                  payment_intent_id: paymentIntentId,
                  payment_amount: paymentData.amount
                }
              }
            }
          })
        });
        
        const paymentMethodData = await paymentMethodResponse.json();
        console.log("Payment link created:", JSON.stringify(paymentMethodData));
        
        if (!paymentMethodResponse.ok) {
          throw new Error(paymentMethodData.errors?.[0]?.detail || "Failed to create payment link");
        }
        
        // Get the checkout URL from the payment link
        const checkoutUrl = paymentMethodData.data.attributes.checkout_url;
        
        // In test environment, immediately update the customer's credit_used
        // This simulates the payment being processed without waiting for confirmation
        if (IS_TEST_ENVIRONMENT && paymentData.customerId) {
          try {
            console.log(`TEST ENVIRONMENT: Immediately processing payment for customer: ${paymentData.customerId}`);
            
            // Get current customer data
            const { data: customerData, error: fetchError } = await fetch(`https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${paymentData.customerId}&select=credit_used`, {
              headers: {
                "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
                "Content-Type": "application/json"
              }
            }).then(res => res.json());
            
            if (fetchError || !customerData || customerData.length === 0) {
              throw new Error(`Failed to fetch customer data: ${fetchError?.message || "Customer not found"}`);
            }
            
            const currentCreditUsed = customerData[0].credit_used || 0;
            const newCreditUsed = Math.max(0, currentCreditUsed - paymentData.amount);
            
            console.log(`TEST ENVIRONMENT: Updating credit: Current: ${currentCreditUsed}, New: ${newCreditUsed}`);
            
            // Update the customer record
            const updateResponse = await fetch(`https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${paymentData.customerId}`, {
              method: "PATCH",
              headers: {
                "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({
                credit_used: newCreditUsed
              })
            });
            
            if (!updateResponse.ok) {
              const updateError = await updateResponse.text();
              console.error(`TEST ENVIRONMENT: Database update error: ${updateError}`);
            } else {
              console.log("TEST ENVIRONMENT: Customer credit updated successfully");
            }
          } catch (testError) {
            console.error("TEST ENVIRONMENT: Error updating credit:", testError);
          }
        }
        
        return new Response(
          JSON.stringify({ 
            data: {
              checkoutUrl: checkoutUrl,
              paymentIntentId: paymentIntentId,
              amount: paymentData.amount,
              customerId: paymentData.customerId
            }
          }),
          {
            status: 200,
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              "Pragma": "no-cache",
              "Expires": "0"
            },
          }
        );
      } catch (apiError) {
        console.error("PayMongo API error:", apiError);
        return new Response(
          JSON.stringify({ error: apiError.message || "Payment gateway error" }),
          { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    } else if (action === "confirm-payment") {
      // Retrieve and process the payment status
      const { paymentIntentId, customerId } = paymentData;

      try {
        // Retrieve the payment intent status
        const paymentIntentResponse = await fetch(`${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`, {
          method: "GET",
          headers: {
            "Authorization": authHeader,
          }
        });
        
        const paymentIntentData = await paymentIntentResponse.json();
        console.log("Payment intent retrieved:", JSON.stringify(paymentIntentData));
        
        if (!paymentIntentResponse.ok) {
          throw new Error(paymentIntentData.errors?.[0]?.detail || "Failed to retrieve payment intent");
        }
        
        const status = paymentIntentData.data.attributes.status;
        const amount = paymentData.amount || paymentIntentData.data.attributes.amount / 100;
        
        // If not already processed in test environment and status is pending or succeeded
        if ((status === "pending" || status === "succeeded") && customerId && (!IS_TEST_ENVIRONMENT || status === "succeeded")) {
          console.log(`Processing ${status} payment: ${customerId}, amount: ${amount}`);
          
          // Get current customer data
          const { data: customerData, error: fetchError } = await fetch(`https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${customerId}&select=credit_used`, {
            headers: {
              "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
              "Content-Type": "application/json"
            }
          }).then(res => res.json());
          
          if (fetchError || !customerData || customerData.length === 0) {
            throw new Error(`Failed to fetch customer data: ${fetchError?.message || "Customer not found"}`);
          }
          
          const currentCreditUsed = customerData[0].credit_used || 0;
          const newCreditUsed = Math.max(0, currentCreditUsed - amount);
          
          console.log(`Updating credit: Current: ${currentCreditUsed}, New: ${newCreditUsed}`);
          
          // Update the customer record
          const updateResponse = await fetch(`https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${customerId}`, {
            method: "PATCH",
            headers: {
              "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              credit_used: newCreditUsed
            })
          });
          
          if (!updateResponse.ok) {
            const updateError = await updateResponse.text();
            throw new Error(`Database update error: ${updateError}`);
          }
          
          console.log("Customer credit updated successfully");
        }
        
        return new Response(
          JSON.stringify({ 
            status: status === "succeeded" ? "success" : "pending",
            message: status === "succeeded" ? "Payment confirmed" : "Payment is being processed",
            paymentDetails: {
              status,
              amount,
              customerId,
              paymentIntentId,
              updated: status === "succeeded" || (IS_TEST_ENVIRONMENT && status === "pending")
            }
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (apiError) {
        console.error("PayMongo confirmation error:", apiError);
        return new Response(
          JSON.stringify({ error: apiError.message || "Payment confirmation error" }),
          { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    } else if (action === "handle-webhook") {
      // Process PayMongo webhook events
      const event = paymentData.data;
      
      // Implement webhook handling for payment confirmations
      if (event && (event.type === "payment.paid" || (IS_TEST_ENVIRONMENT && event.type === "payment.pending"))) {
        const paymentData = event.data;
        const metadata = paymentData.attributes.metadata;
        
        if (metadata && metadata.customer_id) {
          // Update customer credit in database
          const { data, error } = await fetch(`https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${metadata.customer_id}&select=credit_used`, {
            headers: {
              "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
              "Content-Type": "application/json"
            }
          }).then(res => res.json());
          
          if (!error && data && data.length > 0) {
            const amount = paymentData.attributes.amount / 100; // Convert from cents
            const newCreditUsed = Math.max(0, data[0].credit_used - amount);
            
            await fetch(`https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${metadata.customer_id}`, {
              method: "PATCH",
              headers: {
                "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
              },
              body: JSON.stringify({
                credit_used: newCreditUsed
              })
            });
          }
        }
      }
      
      return new Response(
        JSON.stringify({ status: "success" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Payment gateway error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
