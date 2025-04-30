
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
      // Create a checkout session for redirect
      const checkoutData = {
        data: {
          attributes: {
            line_items: [
              {
                name: paymentData.description,
                amount: Math.floor(paymentData.amount * 100), // Convert to smallest currency unit
                currency: "PHP",
                quantity: 1
              }
            ],
            payment_method_types: ["card", "gcash", "grab_pay"],
            success_url: paymentData.returnUrl || "https://example.com/success",
            cancel_url: paymentData.returnUrl || "https://example.com/cancel",
            billing: {
              address: {
                line1: "Test Address",
                city: "Manila",
                state: "Metro Manila",
                country: "PH",
                postal_code: "1234"
              },
              name: "Test Customer",
              email: "testcustomer@example.com",
              phone: "+639123456789"
            },
            metadata: {
              customer_id: paymentData.customerId
            },
            send_email_receipt: false
          }
        }
      };

      // For this example, we're creating a checkout session - in production use real Paymongo API
      console.log("Creating checkout session with data:", JSON.stringify(checkoutData));
      
      // Simulate a response from PayMongo (in production, this would be a real API call)
      const checkoutUrl = `https://checkout.paymongo.com/checkout.html?id=test_checkout_${Date.now()}`;
      
      // Record this payment intent in your database (in production)
      
      return new Response(
        JSON.stringify({ 
          data: {
            checkoutUrl,
            paymentIntentId: `test_intent_${Date.now()}`,
            amount: paymentData.amount,
            customerId: paymentData.customerId
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (action === "confirm-payment") {
      // Handle payment confirmation
      // In production, this would be called by a webhook from PayMongo
      
      // Update customer credit balance in database based on payment
      if (paymentData.customerId && paymentData.amount) {
        // In production, you would verify the payment status with PayMongo first
        console.log(`Payment confirmed: ${paymentData.amount} for customer ${paymentData.customerId}`);
      }
      
      return new Response(
        JSON.stringify({ status: "success", message: "Payment confirmed" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (action === "handle-webhook") {
      // Process PayMongo webhook events (for production use)
      console.log("Received webhook event:", paymentData);
      
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
