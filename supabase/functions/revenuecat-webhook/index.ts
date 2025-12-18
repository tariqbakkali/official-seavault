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

    const userId = event.app_user_id
    const type = event.type
    
    // Check for test user
    if (userId.startsWith("$RCAnonymousID:")) {
        console.log(`Skipping anonymous user: ${userId}`);
        return new Response("Skipped anonymous user", { status: 200 });
    }

    let isPremium: boolean | null = null;
    let membershipTier: string | null = null;

    // Handle subscription status changes
    if (type === 'INITIAL_PURCHASE' || type === 'RENEWAL' || type === 'UNCANCELLATION') {
      isPremium = true;
      membershipTier = 'pro';
    } else if (type === 'EXPIRATION' || type === 'CANCELLATION' || type === 'PRODUCT_CHANGE') {
      // NOTE: CANCELLATION usually means they turned off auto-renew, not that access is lost immediately.
      // But EXPIRATION means access is lost.
      // For simplicity in this v1, checking EXPIRATION is key. 
      // RevenueCat recommends checking the entitlements source of truth via API, but here we are sinking events.
      // If it's EXPIRATION, we definitely revoke.
      if (type === 'EXPIRATION') {
        isPremium = false;
        membershipTier = 'free';
      }
      
      // For CANCELLATION (turning off auto-renew), we might ideally want to keep them as premium until expiration.
      // However, if the payload indicates expiration_at_ms is in the past, then we revoke.
      // For now, let's treat EXPIRATION as the revocation event.
    }

    // Only update if we have a decided status change
    if (isPremium !== null) {
      console.log(`Updating profile for User ID: ${userId} to Premium: ${isPremium}, Tier: ${membershipTier}`)

      const { error } = await supabaseClient
        .from('profiles')
        .update({
          is_premium: isPremium,
          membership_tier: membershipTier,
        })
        .eq('id', userId)

      if (error) {
        console.error("Error updating profile:", error)
        return new Response("Error updating profile", { status: 500 })
      }
      console.log("Profile updated successfully")
    }

    // Existing Shop Sale Logic
    const shopId = event.subscriber_attributes?.shop_id?.value
    if (shopId && (type === 'INITIAL_PURCHASE' || type === 'RENEWAL')) {
        const amount = event.price_in_purchased_currency
        const transactionId = event.transaction_id
        const currency = event.currency
        
        console.log(`Processing sale for Shop ID: ${shopId}, User ID: ${userId}, Amount: ${amount} ${currency}`)

        const { error: saleError } = await supabaseClient
            .from('shop_sales')
            .insert({
              shop_id: shopId,
              user_id: userId,
              amount: amount,
              revenuecat_transaction: transactionId,
              purchased_at: new Date(event.purchased_at_ms).toISOString(),
            })

        if (saleError) {
             console.error("Error inserting sale:", saleError)
             // We don't return error here to avoid failing the whole webhook if profile update succeeded
        } else {
             console.log("Sale recorded successfully")
        }
    }

    return new Response("Webhook processed", { status: 200 })

  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
})
