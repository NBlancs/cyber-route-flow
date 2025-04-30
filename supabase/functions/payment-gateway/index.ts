
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

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
        
        // Then create a payment method
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
                success_url: `${paymentData.returnUrl}?payment_status=success&payment_id=${paymentIntentId}`,
                cancel_url: `${paymentData.returnUrl}?payment_status=failed&payment_id=${paymentIntentId}`,
                reference_number: `order_${Date.now()}`,
                metadata: {
                  customer_id: paymentData.customerId,
                  payment_intent_id: paymentIntentId
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
      // In production, this would retrieve the payment status from PayMongo
      const { paymentIntentId, customerId, amount } = paymentData;

      try {
        // Retrieve the payment intent status
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
        
        // If payment was successful, update customer's credit_used in the database
        if (status === "succeeded" && customerId && amount) {
          // Deduct the paid amount from the customer's credit_used
          const { data, error } = await req.supabase
            .from('customers')
            .select('credit_used')
            .eq('id', customerId)
            .single();
            
          if (error) {
            throw new Error(`Database error: ${error.message}`);
          }
            
          const newCreditUsed = Math.max(0, data.credit_used - amount);
            
          const { error: updateError } = await req.supabase
            .from('customers')
            .update({ credit_used: newCreditUsed })
            .eq('id', customerId);
            
          if (updateError) {
            throw new Error(`Database update error: ${updateError.message}`);
          }
        }
        
        return new Response(
          JSON.stringify({ 
            status: status === "succeeded" ? "success" : "pending",
            message: status === "succeeded" ? "Payment confirmed" : "Payment is being processed" 
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
      if (event && event.type === "payment.paid") {
        const paymentData = event.data;
        const metadata = paymentData.attributes.metadata;
        
        if (metadata && metadata.customer_id) {
          // Update customer credit in database
          const { data, error } = await req.supabase
            .from('customers')
            .select('credit_used')
            .eq('id', metadata.customer_id)
            .single();
            
          if (!error && data) {
            const amount = paymentData.attributes.amount / 100; // Convert from cents
            const newCreditUsed = Math.max(0, data.credit_used - amount);
            
            await req.supabase
              .from('customers')
              .update({ credit_used: newCreditUsed })
              .eq('id', metadata.customer_id);
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
