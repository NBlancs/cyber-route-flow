
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const EASYPOST_API_URL = "https://api.easypost.com/v2";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, shippingData } = await req.json();
    const apiKey = Deno.env.get("EASYPOST_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "EasyPost API key not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Authorization header with API key
    const authHeader = `Bearer ${apiKey}`;

    if (action === "create-shipment") {
      // Create a shipment
      const response = await fetch(`${EASYPOST_API_URL}/shipments`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({
          shipment: {
            to_address: shippingData.toAddress,
            from_address: shippingData.fromAddress,
            parcel: shippingData.parcel,
            options: shippingData.options,
          },
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "buy-shipment") {
      // Buy a shipment label
      const response = await fetch(`${EASYPOST_API_URL}/shipments/${shippingData.shipmentId}/buy`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({
          rate: { id: shippingData.rateId },
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "track-shipment") {
      // Track a shipment
      const response = await fetch(`${EASYPOST_API_URL}/trackers`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({
          tracker: {
            tracking_code: shippingData.trackingCode,
            carrier: shippingData.carrier,
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
