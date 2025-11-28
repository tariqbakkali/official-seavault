-- Drop conflicting tables
DROP TABLE IF EXISTS public.shop_sales;
DROP TABLE IF EXISTS public.shops;

-- Alter dive_shops table
ALTER TABLE public.dive_shops 
ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS lifetime boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS total_redeemed integer DEFAULT 0;

-- Create shop_referrals table
CREATE TABLE IF NOT EXISTS public.shop_referrals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id bigint REFERENCES public.dive_shops(id),
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on shop_referrals
ALTER TABLE public.shop_referrals ENABLE ROW LEVEL SECURITY;

-- Policy for shop_referrals: Users can insert their own referrals (via RPC usually, but good to have)
-- Actually, we might want to restrict this to service role or RPC only.
-- Let's allow authenticated users to read their own referrals.
CREATE POLICY "Users can read own referrals" ON public.shop_referrals
    FOR SELECT USING (auth.uid() = user_id);

-- Create RPC to redeem referral
CREATE OR REPLACE FUNCTION public.redeem_shop_referral(ref_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_shop_id bigint;
    current_user_id uuid;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Find shop
    SELECT id INTO found_shop_id
    FROM public.dive_shops
    WHERE referral_code = ref_code AND is_active = true;

    IF found_shop_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Invalid or inactive referral code');
    END IF;

    -- Check if already redeemed (optional, depending on business logic. Assuming one redemption per user per shop?)
    -- User didn't specify unique constraint. But usually you only redeem once.
    -- Let's check if this specific referral is already recorded for this user?
    -- Actually, maybe they can use the code multiple times? No, usually once.
    -- I'll add a check.
    IF EXISTS (SELECT 1 FROM public.shop_referrals WHERE shop_id = found_shop_id AND user_id = current_user_id) THEN
         RETURN json_build_object('success', false, 'message', 'Referral already redeemed');
    END IF;

    -- Insert referral
    INSERT INTO public.shop_referrals (shop_id, user_id)
    VALUES (found_shop_id, current_user_id);

    -- Increment total_redeemed
    UPDATE public.dive_shops
    SET total_redeemed = total_redeemed + 1
    WHERE id = found_shop_id;

    RETURN json_build_object('success', true, 'shop_id', found_shop_id);
END;
$$;
