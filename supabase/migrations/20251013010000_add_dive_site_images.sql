-- Add dive site images table
create table "public"."dive_site_images" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "dive_site_id" uuid,
    "image_url" text,
    "thumbnail_url" text,
    "file_name" text not null,
    "file_size" integer,
    "mime_type" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "deleted" boolean default false
);

-- Add primary key constraint
alter table "public"."dive_site_images" add constraint "dive_site_images_pkey" primary key ("id");

-- Add foreign key constraints
alter table "public"."dive_site_images" add constraint "dive_site_images_user_id_fkey" 
    foreign key ("user_id") references "public"."profiles"("id") on delete cascade;

alter table "public"."dive_site_images" add constraint "dive_site_images_dive_site_id_fkey" 
    foreign key ("dive_site_id") references "public"."dive_sites"("id") on delete set null;

-- Add indexes for better query performance
create index "dive_site_images_user_id_idx" on "public"."dive_site_images" ("user_id");
create index "dive_site_images_dive_site_id_idx" on "public"."dive_site_images" ("dive_site_id");
create index "dive_site_images_created_at_idx" on "public"."dive_site_images" ("created_at");
create index "dive_site_images_deleted_idx" on "public"."dive_site_images" ("deleted");

-- Enable row level security
alter table "public"."dive_site_images" enable row level security;

-- Create policies for dive site images
create policy "Users can view their own images"
    on "public"."dive_site_images" for select
    using (auth.uid() = user_id);

create policy "Users can insert their own images"
    on "public"."dive_site_images" for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own images"
    on "public"."dive_site_images" for update
    using (auth.uid() = user_id);

create policy "Users can delete their own images"
    on "public"."dive_site_images" for delete
    using (auth.uid() = user_id);

-- Add updated_at trigger
create trigger "handle_dive_site_images_updated_at"
    before update on "public"."dive_site_images"
    for each row execute procedure moddatetime(updated_at);

-- Add storage bucket for dive site images
insert into storage.buckets (id, name, public)
values ('dive-site-images', 'dive-site-images', true)
on conflict (id) do nothing;

-- Create storage policies for dive site images bucket
create policy "Anyone can upload dive site images"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'dive-site-images');

create policy "Anyone can view dive site images"
    on storage.objects for select
    using (bucket_id = 'dive-site-images');

create policy "Users can update their own dive site images"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'dive-site-images' and owner = auth.uid());

create policy "Users can delete their own dive site images"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'dive-site-images' and owner = auth.uid());