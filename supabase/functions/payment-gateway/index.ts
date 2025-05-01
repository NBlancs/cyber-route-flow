
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
        // Log the payload received for debugging
        console.log("Creating payment intent with payload:", JSON.stringify(paymentData));

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
        let paymentUpdated = false;
        if (paymentData.customerId) {
          try {
            console.log(`Updating payment for customer: ${paymentData.customerId}`);
            
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
            
            console.log(`Updating credit: Current: ${currentCreditUsed}, New: ${newCreditUsed}`);
            
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
              console.error(`Database update error: ${updateError}`);
              throw new Error(`Failed to update customer credit: ${updateError}`);
            } else {
              console.log("Customer credit updated successfully");
              paymentUpdated = true;
            }
          } catch (updateError) {
            console.error("Error updating credit:", updateError);
            // We don't throw here - we still want to return the checkout URL
            // even if the update fails
          }
        }
        
        return new Response(
          JSON.stringify({ 
            data: {
              checkoutUrl: checkoutUrl,
              paymentIntentId: paymentIntentId,
              amount: paymentData.amount,
              customerId: paymentData.customerId
            },
            paymentDetails: {
              status: "pending",
              amount: paymentData.amount,
              customerId: paymentData.customerId,
              paymentIntentId: paymentIntentId,
              updated: paymentUpdated
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
      const { paymentIntentId, customerId, amount } = paymentData;

      try {
        console.log(`Confirming payment for ID: ${paymentIntentId}, customer: ${customerId}, amount: ${amount}`);
        
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
        const paymentAmount = amount || paymentIntentData.data.attributes.amount / 100;
        const paymentMetadata = paymentIntentData.data.attributes.metadata || {};
        const retrievedCustomerId = paymentMetadata.customer_id || customerId;
        
        // If status is pending or succeeded, update customer credit
        let creditUpdated = false;
        if ((status === "pending" || status === "succeeded") && retrievedCustomerId) {
          try {
            console.log(`Processing ${status} payment: ${retrievedCustomerId}, amount: ${paymentAmount}`);
            
            // Get current customer data
            const { data: customerData, error: fetchError } = await fetch(`https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${retrievedCustomerId}&select=credit_used`, {
              headers: {
                "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
                "Content-Type": "application/json"
              }
            }).then(res => res.json());
            
            if (fetchError || !customerData || customerData.length === 0) {
              console.error("Failed to fetch customer data:", fetchError || "Customer not found");
              throw new Error(`Failed to fetch customer data: ${fetchError?.message || "Customer not found"}`);
            }
            
            const currentCreditUsed = customerData[0].credit_used || 0;
            const newCreditUsed = Math.max(0, currentCreditUsed - paymentAmount);
            
            console.log(`Updating credit: Current: ${currentCreditUsed}, New: ${newCreditUsed}`);
            
            // Update the customer record
            const updateResponse = await fetch(`https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${retrievedCustomerId}`, {
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
              console.error(`Database update error: ${updateError}`);
              throw new Error(`Failed to update customer credit: ${updateError}`);
            }
            
            console.log("Customer credit updated successfully");
            creditUpdated = true;
          } catch (updateError) {
            console.error("Error updating credit:", updateError);
            // We still want to return payment status even if update fails
          }
        } else {
          console.log(`Payment status ${status} does not require updating credit or customer ID is missing`);
        }
        
        return new Response(
          JSON.stringify({ 
            status: status === "succeeded" ? "success" : "pending",
            message: status === "succeeded" ? "Payment confirmed" : "Payment is being processed",
            paymentDetails: {
              status,
              amount: paymentAmount,
              customerId: retrievedCustomerId,
              paymentIntentId,
              updated: creditUpdated
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
      if (event && (event.type === "payment.paid" || event.type === "payment.pending")) {
        const paymentData = event.data;
        const metadata = paymentData.attributes.metadata;
        
        if (metadata && metadata.customer_id) {
          try {
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
              
              console.log(`Webhook updated customer credit: ${metadata.customer_id}, amount: ${amount}`);
            }
          } catch (error) {
            console.error("Error processing webhook:", error);
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
    } else if (action === "check-payment-status") {
      // Check the status of a payment
      const { paymentIntentId } = paymentData;
      
      try {
        console.log(`Checking payment status for ID: ${paymentIntentId}`);
        
        const paymentIntentResponse = await fetch(`${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`, {
          method: "GET",
          headers: {
            "Authorization": authHeader,
          }
        });
        
        const paymentIntentData = await paymentIntentResponse.json();
        
        if (!paymentIntentResponse.ok) {
          throw new Error(paymentIntentData.errors?.[0]?.detail || "Failed to retrieve payment intent");
        }
        
        const status = paymentIntentData.data.attributes.status;
        const metadata = paymentIntentData.data.attributes.metadata || {};
        const customerId = metadata.customer_id;
        const amount = paymentIntentData.data.attributes.amount / 100;
        
        return new Response(
          JSON.stringify({ 
            paymentDetails: {
              status,
              customerId,
              amount,
              paymentIntentId,
              updated: false
            },
            metadata
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (apiError) {
        console.error("PayMongo status check error:", apiError);
        return new Response(
          JSON.stringify({ error: apiError.message || "Payment status check error" }),
          { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
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
