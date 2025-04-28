
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

    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: "PayMongo API key not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Authorization header with base64 encoded secret key
    const authHeader = `Basic ${btoa(secretKey + ":")}`;

    if (action === "create-payment-intent") {
      // Create a payment intent
      const response = await fetch(`${PAYMONGO_API_URL}/payment_intents`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: paymentData.amount * 100, // Convert to smallest currency unit
              payment_method_allowed: ["card", "gcash", "grabpay"],
              payment_method_options: { card: { request_three_d_secure: "automatic" } },
              currency: "PHP",
              description: paymentData.description,
            },
          },
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "confirm-payment") {
      // Confirm a payment
      const response = await fetch(`${PAYMONGO_API_URL}/payment_intents/${paymentData.paymentIntentId}/attach`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentData.paymentMethodId,
              return_url: paymentData.returnUrl,
            },
          },
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
