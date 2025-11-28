-- Create shops table
create table public.shops (
  id uuid not null default gen_random_uuid (),
  name text not null,
  discount_amount numeric not null default 0,
  ios_link text null,
  android_link text null,
  created_at timestamp with time zone not null default now(),
  constraint shops_pkey primary key (id)
);

-- Create shop_sales table
create table public.shop_sales (
  id uuid not null default gen_random_uuid (),
  shop_id uuid not null,
  user_id uuid null, -- Can be null if we track sales before user auth, but usually linked
  amount numeric not null,
  revenuecat_transaction text null,
  purchased_at timestamp with time zone not null default now(),
  constraint shop_sales_pkey primary key (id),
  constraint shop_sales_shop_id_fkey foreign key (shop_id) references shops (id),
  constraint shop_sales_user_id_fkey foreign key (user_id) references auth.users (id)
);

-- RLS Policies
alter table public.shops enable row level security;
alter table public.shop_sales enable row level security;

-- Allow public read access to shops (needed for fetching discount info)
create policy "Allow public read access to shops"
  on public.shops
  for select
  to public
  using (true);

-- Allow authenticated users to insert sales (or service role)
-- Ideally, sales are recorded via webhook (service role), but if app records it:
create policy "Allow authenticated insert to shop_sales"
  on public.shop_sales
  for insert
  to authenticated
  with check (true);

-- Allow users to view their own sales? Maybe not needed yet.
