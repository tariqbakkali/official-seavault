-- Enable RLS on profiles if not already enabled
alter table "public"."profiles" enable row level security;

-- Allow authenticated users to view all profiles (needed for search)
drop policy if exists "Profiles are viewable by everyone" on "public"."profiles";
create policy "Profiles are viewable by everyone"
on "public"."profiles"
for select
to authenticated
using (true);

-- Allow users to update their own profile
drop policy if exists "Users can update own profile" on "public"."profiles";
create policy "Users can update own profile"
on "public"."profiles"
for update
to authenticated
using (auth.uid() = id);

-- Allow users to insert their own profile
drop policy if exists "Users can insert own profile" on "public"."profiles";
create policy "Users can insert own profile"
on "public"."profiles"
for insert
to authenticated
with check (auth.uid() = id);
