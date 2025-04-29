
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const LALAMOVE_API_URL = "https://rest.sandbox.lalamove.com"; // Sandbox URL, use "https://rest.lalamove.com" for production

// Helper function to generate HMAC signature for Lalamove API authentication
function generateSignature(apiKey: string, secretKey: string, timestamp: number, method: string, path: string, body: string) {
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
  const key = new TextEncoder().encode(secretKey);
  const message = new TextEncoder().encode(rawSignature);
  
  // Using SubtleCrypto for HMAC-SHA256
  return crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  ).then(cryptoKey => {
    return crypto.subtle.sign("HMAC", cryptoKey, message);
  }).then(buffer => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, shippingData } = await req.json();
    const apiKey = Deno.env.get("LALAMOVE_API_KEY");
    const secretKey = Deno.env.get("LALAMOVE_SECRET_KEY");
    const marketRegion = Deno.env.get("LALAMOVE_MARKET") || "PH"; // Default to Philippines

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Lalamove API credentials not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    
    if (action === "create-shipment") {
      // Format the address data for Lalamove
      const { toAddress, fromAddress, parcel } = shippingData;
      
      // Create a quotation first (required by Lalamove flow)
      const quotePath = `/v3/quotations`;
      const quoteBody = JSON.stringify({
        serviceType: "MOTORCYCLE", // Default to motorcycle, can be changed as needed
        language: "en_PH",
        stops: [
          {
            coordinates: {
              lat: "0", // These would need to be geocoded from the address
              lng: "0"  // These would need to be geocoded from the address
            },
            address: fromAddress.street1,
            contact: {
              name: fromAddress.name,
              phone: fromAddress.phone
            }
          },
          {
            coordinates: {
              lat: "0", // These would need to be geocoded from the address
              lng: "0"  // These would need to be geocoded from the address
            },
            address: toAddress.street1,
            contact: {
              name: toAddress.name,
              phone: toAddress.phone
            }
          }
        ],
        specialRequests: [],
        requesterContact: {
          name: fromAddress.name,
          phone: fromAddress.phone
        }
      });
      
      const signature = await generateSignature(
        apiKey,
        secretKey,
        timestamp,
        "POST",
        quotePath,
        quoteBody
      );
      
      const quoteResponse = await fetch(`${LALAMOVE_API_URL}${quotePath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `hmac ${apiKey}:${timestamp}:${signature}`,
          "Market": marketRegion,
          ...corsHeaders,
        },
        body: quoteBody
      });
      
      const quoteData = await quoteResponse.json();
      
      if (!quoteResponse.ok) {
        return new Response(JSON.stringify({ error: quoteData }), {
          status: quoteResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Return quotation details
      return new Response(JSON.stringify(quoteData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      
    } else if (action === "buy-shipment") {
      // Place an order with the quotation
      const orderPath = `/v3/orders`;
      const orderBody = JSON.stringify({
        quotationId: shippingData.quotationId,
        sender: {
          stopId: shippingData.senderStopId,
          name: shippingData.fromAddress.name,
          phone: shippingData.fromAddress.phone
        },
        recipients: [
          {
            stopId: shippingData.recipientStopId,
            name: shippingData.toAddress.name,
            phone: shippingData.toAddress.phone
          }
        ],
        isPOD: false, // Proof of delivery
        paymentMethod: "CREDIT"
      });
      
      const signature = await generateSignature(
        apiKey,
        secretKey,
        timestamp,
        "POST",
        orderPath,
        orderBody
      );
      
      const orderResponse = await fetch(`${LALAMOVE_API_URL}${orderPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `hmac ${apiKey}:${timestamp}:${signature}`,
          "Market": marketRegion,
          ...corsHeaders,
        },
        body: orderBody
      });
      
      const orderData = await orderResponse.json();
      
      return new Response(JSON.stringify(orderData), {
        status: orderResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      
    } else if (action === "track-shipment") {
      // Track a shipment
      const orderId = shippingData.orderId;
      const trackPath = `/v3/orders/${orderId}`;
      
      const signature = await generateSignature(
        apiKey,
        secretKey,
        timestamp,
        "GET",
        trackPath,
        ""
      );
      
      const trackResponse = await fetch(`${LALAMOVE_API_URL}${trackPath}`, {
        method: "GET",
        headers: {
          "Authorization": `hmac ${apiKey}:${timestamp}:${signature}`,
          "Market": marketRegion,
          ...corsHeaders,
        }
      });
      
      const trackData = await trackResponse.json();
      
      return new Response(JSON.stringify(trackData), {
        status: trackResponse.status,
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
    console.error("Shipping API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
