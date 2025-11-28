import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("RevenueCat Webhook Function Initialized")

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { event } = body

    console.log("Received event:", JSON.stringify(event))

    if (!event) {
      return new Response("No event found", { status: 400 })
    }

    // We only care about successful purchases
    if (event.type !== 'INITIAL_PURCHASE' && event.type !== 'RENEWAL' && event.type !== 'NON_RENEWING_PURCHASE') {
      return new Response("Event type ignored", { status: 200 })
    }

    const shopId = event.subscriber_attributes?.shop_id?.value
    const userId = event.app_user_id
    const amount = event.price_in_purchased_currency
    const transactionId = event.transaction_id
    const currency = event.currency

    if (shopId) {
      console.log(`Processing sale for Shop ID: ${shopId}, User ID: ${userId}, Amount: ${amount} ${currency}`)

      const { error } = await supabaseClient
        .from('shop_sales')
        .insert({
          shop_id: shopId,
          user_id: userId, // Assuming app_user_id maps to Supabase user_id
          amount: amount,
          revenuecat_transaction: transactionId,
          purchased_at: new Date(event.purchased_at_ms).toISOString(),
        })

      if (error) {
        console.error("Error inserting sale:", error)
        return new Response("Error recording sale", { status: 500 })
      }

      console.log("Sale recorded successfully")
    } else {
      console.log("No shop_id found in subscriber attributes")
    }

    return new Response("Webhook processed", { status: 200 })

  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
})
