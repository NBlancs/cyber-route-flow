// Import from the latest Deno standard library
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYMONGO_API_URL = "https://api.paymongo.com/v1";
const IS_TEST_ENVIRONMENT = true; // Set to false in production

// Create a debug log helper to make logs more consistent
function debugLog(context, message, data = null) {
  const logMessage = `[PaymentGateway] ${context}: ${message}`;
  if (data) {
    console.log(logMessage, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
}

// Add this new action to retrieve all payments from PayMongo
async function retrieveAllPayments(authHeader, params = {}) {
  try {
    // Build query string from parameters
    const queryParams = new URLSearchParams();
    
    // Always set a default limit if not provided
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    } else {
      queryParams.append('limit', '10'); // Default limit
    }
    
    // Handle pagination parameters
    if (params.starting_after) queryParams.append('starting_after', params.starting_after);
    if (params.ending_before) queryParams.append('ending_before', params.ending_before);
    
    // These are alternative pagination mechanisms - use only if needed
    // if (params.before) queryParams.append('before', params.before);
    // if (params.after) queryParams.append('after', params.after);
    
    // Add created field for date filtering if needed
    // if (params.created && Object.keys(params.created).length > 0) {
    //   Object.entries(params.created).forEach(([key, value]) => {
    //     queryParams.append(`created[${key}]`, value.toString());
    //   });
    // }
    
    const queryString = queryParams.toString();
    const url = `${PAYMONGO_API_URL}/payments${queryString ? `?${queryString}` : ''}`;
    
    debugLog("FETCH", `Retrieving payments from PayMongo: ${url}`);
    
    // Make the request to PayMongo
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });
    
    debugLog("RESPONSE", `PayMongo response status: ${response.status}`);
    
    // Get the raw response text for error handling
    const responseText = await response.text();
    
    // Handle error responses
    if (!response.ok) {
      let errorDetail = "Unknown error";
      
      try {
        const errorData = JSON.parse(responseText);
        errorDetail = errorData.errors?.[0]?.detail || `Failed to retrieve payments: ${response.status}`;
        debugLog("ERROR", `PayMongo API error details: ${errorDetail}`);
      } catch (parseError) {
        errorDetail = responseText || `Failed to retrieve payments: ${response.status}`;
        debugLog("ERROR", `Failed to parse error response: ${responseText}`);
      }
      
      throw new Error(errorDetail);
    }
    
    let data;
    try {
      // Parse the successful response
      data = JSON.parse(responseText);
      
      // Add debug information about the response
      debugLog("SUCCESS", `Retrieved ${data.data?.length || 0} payments, has_more: ${data.has_more}`);
      
      if (data.data?.length === 0) {
        debugLog("INFO", "No payments found in the response");
      } else if (data.data?.length > 0) {
        debugLog("INFO", `First payment ID: ${data.data[0].id}, Last payment ID: ${data.data[data.data.length-1].id}`);
      }
      
      // Ensure the response has the expected format
      return {
        data: data.data || [],
        has_more: data.has_more || false
      };
    } catch (parseError) {
      debugLog("ERROR", `Failed to parse success response: ${responseText}`);
      throw new Error("Failed to parse PayMongo response");
    }
  } catch (error) {
    debugLog("ERROR", `Error retrieving payments: ${error.message}`);
    throw error;
  }
}

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
        debugLog("CREATE_PAYMENT_INTENT", "Creating payment intent with payload", paymentData);

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
        debugLog("CREATE_PAYMENT_INTENT", "Payment intent created", paymentIntentData);
        
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
        debugLog("CREATE_PAYMENT_LINK", "Payment link created", paymentMethodData);
        
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
            debugLog("UPDATE_CREDIT", `Checking if customer exists before updating: ${paymentData.customerId}`);
            
            // First check if the customer exists by querying the ID directly
            const customerCheckResponse = await fetch(
              `https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${paymentData.customerId}&select=id,credit_used`, 
              {
                method: "GET",
                headers: {
                  "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
                  "Content-Type": "application/json"
                }
              }
            );
            
            if (!customerCheckResponse.ok) {
              throw new Error(`Failed to fetch customer data: ${await customerCheckResponse.text()}`);
            }
            
            const customerData = await customerCheckResponse.json();
            
            // Check if customer data was found
            if (!customerData || !Array.isArray(customerData) || customerData.length === 0) {
              debugLog("UPDATE_CREDIT", `Customer not found with ID: ${paymentData.customerId}`);
              throw new Error(`Customer not found with ID: ${paymentData.customerId}`);
            }
            
            debugLog("UPDATE_CREDIT", "Customer found", customerData);
            const currentCreditUsed = customerData[0]?.credit_used || 0;
            const newCreditUsed = Math.max(0, currentCreditUsed - paymentData.amount);
            
            debugLog("UPDATE_CREDIT", `Updating credit: Current: ${currentCreditUsed}, New: ${newCreditUsed}`);
            
            // Update the customer record
            const updateResponse = await fetch(
              `https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${paymentData.customerId}`, 
              {
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
              }
            );
            
            if (!updateResponse.ok) {
              const updateError = await updateResponse.text();
              debugLog("UPDATE_CREDIT", `Database update error: ${updateError}`);
              throw new Error(`Failed to update customer credit: ${updateError}`);
            } else {
              debugLog("UPDATE_CREDIT", "Customer credit updated successfully");
              paymentUpdated = true;
            }
          } catch (updateError) {
            debugLog("UPDATE_CREDIT", "Error updating credit", updateError);
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
        debugLog("CREATE_PAYMENT_INTENT", "PayMongo API error", apiError);
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
        debugLog("CONFIRM_PAYMENT", `Confirming payment for ID: ${paymentIntentId}, customer: ${customerId}, amount: ${amount}`);
        
        // Retrieve the payment intent status
        const paymentIntentResponse = await fetch(`${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`, {
          method: "GET",
          headers: {
            "Authorization": authHeader,
          }
        });
        
        const paymentIntentData = await paymentIntentResponse.json();
        debugLog("CONFIRM_PAYMENT", "Payment intent retrieved", paymentIntentData);
        
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
            debugLog("CONFIRM_PAYMENT", `Processing ${status} payment: ${retrievedCustomerId}, amount: ${paymentAmount}`);
            
            // First check if the customer exists by querying the ID directly
            const customerCheckResponse = await fetch(
              `https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${retrievedCustomerId}&select=id,credit_used`, 
              {
                method: "GET",
                headers: {
                  "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
                  "Content-Type": "application/json"
                }
              }
            );
            
            if (!customerCheckResponse.ok) {
              throw new Error(`Failed to fetch customer data: ${await customerCheckResponse.text()}`);
            }
            
            const customerData = await customerCheckResponse.json();
            
            // Check if customer data was found
            if (!customerData || !Array.isArray(customerData) || customerData.length === 0) {
              debugLog("CONFIRM_PAYMENT", `Customer not found with ID: ${retrievedCustomerId}`);
              throw new Error(`Customer not found with ID: ${retrievedCustomerId}`);
            }
            
            const currentCreditUsed = customerData[0].credit_used || 0;
            const newCreditUsed = Math.max(0, currentCreditUsed - paymentAmount);
            
            debugLog("CONFIRM_PAYMENT", `Updating credit: Current: ${currentCreditUsed}, New: ${newCreditUsed}`);
            
            // Update the customer record
            const updateResponse = await fetch(
              `https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${retrievedCustomerId}`, 
              {
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
              }
            );
            
            if (!updateResponse.ok) {
              const updateError = await updateResponse.text();
              debugLog("CONFIRM_PAYMENT", `Database update error: ${updateError}`);
              throw new Error(`Failed to update customer credit: ${updateError}`);
            }
            
            debugLog("CONFIRM_PAYMENT", "Customer credit updated successfully");
            creditUpdated = true;
          } catch (updateError) {
            debugLog("CONFIRM_PAYMENT", "Error updating credit", updateError);
            // We still want to return payment status even if update fails
          }
        } else {
          debugLog("CONFIRM_PAYMENT", `Payment status ${status} does not require updating credit or customer ID is missing`);
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
        debugLog("CONFIRM_PAYMENT", "PayMongo confirmation error", apiError);
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
            // First check if the customer exists
            const customerCheckResponse = await fetch(
              `https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${metadata.customer_id}&select=id,credit_used`, 
              {
                method: "GET",
                headers: {
                  "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
                  "Content-Type": "application/json"
                }
              }
            );
            
            if (!customerCheckResponse.ok) {
              throw new Error(`Failed to fetch customer data: ${await customerCheckResponse.text()}`);
            }
            
            const customerData = await customerCheckResponse.json();
            
            // Check if customer data was found
            if (!customerData || !Array.isArray(customerData) || customerData.length === 0) {
              debugLog("WEBHOOK", `Customer not found with ID: ${metadata.customer_id}`);
              throw new Error(`Customer not found with ID: ${metadata.customer_id}`);
            }
            
            const amount = paymentData.attributes.amount / 100; // Convert from cents
            const newCreditUsed = Math.max(0, customerData[0].credit_used - amount);
            
            await fetch(
              `https://hrpevihxkuqwdbvcdmqx.supabase.co/rest/v1/customers?id=eq.${metadata.customer_id}`, 
              {
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
              }
            );
              
            debugLog("WEBHOOK", `Webhook updated customer credit: ${metadata.customer_id}, amount: ${amount}`);
          } catch (error) {
            debugLog("WEBHOOK", "Error processing webhook", error);
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
        debugLog("CHECK_PAYMENT_STATUS", `Checking payment status for ID: ${paymentIntentId}`);
        
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
        debugLog("CHECK_PAYMENT_STATUS", "PayMongo status check error", apiError);
        return new Response(
          JSON.stringify({ error: apiError.message || "Payment status check error" }),
          { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    } else if (action === "list-payments") {
      // List all payments from PayMongo
      try {
        debugLog("LIST_PAYMENTS", "Retrieving all payments from PayMongo");
        
        // Extract optional query parameters
        const queryParams = paymentData?.params || {};
        
        // Use the retrieveAllPayments helper function
        const paymentsData = await retrieveAllPayments(authHeader, queryParams);
        
        return new Response(
          JSON.stringify(paymentsData),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (apiError) {
        debugLog("LIST_PAYMENTS", "PayMongo payments retrieval error", apiError);
        return new Response(
          JSON.stringify({ error: apiError.message || "Failed to retrieve payment transactions" }),
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
    debugLog("ERROR", "Payment gateway error", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
