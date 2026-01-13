-- Create friends table
create table "public"."friends" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null references profiles(id) on delete cascade,
    "friend_id" uuid not null references profiles(id) on delete cascade,
    "status" text check (status in ('pending', 'accepted', 'blocked')) default 'pending',
    "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
    unique("user_id", "friend_id")
);

-- Turn on RLS
alter table "public"."friends" enable row level security;

-- Policies
create policy "Users can view their own friends"
on "public"."friends"
for select
using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can insert friend requests"
on "public"."friends"
for insert
with check (auth.uid() = user_id);

create policy "Users can update their received friend requests or own friendships"
on "public"."friends"
for update
using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can delete their friendships"
on "public"."friends"
for delete
using (auth.uid() = user_id or auth.uid() = friend_id);
