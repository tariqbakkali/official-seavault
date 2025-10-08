create extension if not exists "moddatetime" with schema "public" version '1.0';

create table "public"."achievements" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "name" text not null,
    "description" text,
    "category" text,
    "icon_name" text,
    "points" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone
);


create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone default now(),
    "image_url" text,
    "updated_at" timestamp with time zone
);


create table "public"."creatures" (
    "id" uuid not null default gen_random_uuid(),
    "creature_id" text not null,
    "name" text not null,
    "scientific_name" text,
    "category_id" uuid,
    "points" integer not null,
    "description" text,
    "habitat" text,
    "diet" text,
    "depth_range" text,
    "length" text,
    "weight" text,
    "lifespan" text,
    "image_url" text,
    "created_at" timestamp with time zone default now(),
    "class" text,
    "updated_at" timestamp with time zone
);


create table "public"."dive_sites" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "latitude" double precision,
    "longitude" double precision,
    "osm_id" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "full_name" text,
    "avatar_url" text,
    "membership_tier" text,
    "created_at" timestamp with time zone default now(),
    "is_premium" boolean,
    "has_seen_onboarding" boolean,
    "updated_at" timestamp with time zone default now()
);


create table "public"."sightings" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "creature_id" uuid,
    "date" timestamp with time zone not null,
    "dive_notes" text,
    "image_url" text,
    "created_at" timestamp with time zone default now(),
    "dive_site_id" uuid,
    "dive_type" text,
    "time_of_day" text,
    "depth" text,
    "creature_notes" text,
    "updated_at" timestamp with time zone default now()
);


create table "public"."wishlists" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "creature_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "deleted" boolean default false
);


CREATE UNIQUE INDEX achievements_code_key ON public.achievements USING btree (code);

CREATE UNIQUE INDEX achievements_pkey ON public.achievements USING btree (id);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX creatures_pkey ON public.creatures USING btree (id);

CREATE UNIQUE INDEX dive_sites_pkey ON public.dive_sites USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX sightings_pkey ON public.sightings USING btree (id);

CREATE UNIQUE INDEX wishlists_pkey ON public.wishlists USING btree (id);

alter table "public"."achievements" add constraint "achievements_pkey" PRIMARY KEY using index "achievements_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."creatures" add constraint "creatures_pkey" PRIMARY KEY using index "creatures_pkey";

alter table "public"."dive_sites" add constraint "dive_sites_pkey" PRIMARY KEY using index "dive_sites_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."sightings" add constraint "sightings_pkey" PRIMARY KEY using index "sightings_pkey";

alter table "public"."wishlists" add constraint "wishlists_pkey" PRIMARY KEY using index "wishlists_pkey";

alter table "public"."achievements" add constraint "achievements_code_key" UNIQUE using index "achievements_code_key";

alter table "public"."creatures" add constraint "creatures_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE not valid;

alter table "public"."creatures" validate constraint "creatures_category_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."sightings" add constraint "sightings_creature_id_fkey" FOREIGN KEY (creature_id) REFERENCES creatures(id) ON DELETE CASCADE not valid;

alter table "public"."sightings" validate constraint "sightings_creature_id_fkey";

alter table "public"."sightings" add constraint "sightings_dive_site_id_fkey" FOREIGN KEY (dive_site_id) REFERENCES dive_sites(id) not valid;

alter table "public"."sightings" validate constraint "sightings_dive_site_id_fkey";

alter table "public"."sightings" add constraint "sightings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."sightings" validate constraint "sightings_user_id_fkey";

alter table "public"."wishlists" add constraint "wishlists_creature_id_fkey" FOREIGN KEY (creature_id) REFERENCES creatures(id) ON DELETE CASCADE not valid;

alter table "public"."wishlists" validate constraint "wishlists_creature_id_fkey";

alter table "public"."wishlists" add constraint "wishlists_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."wishlists" validate constraint "wishlists_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 10)
 RETURNS TABLE(user_id uuid, full_name text, avatar_url text, creatures_discovered bigint, total_points bigint, rank bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            p.id as user_id,
            p.full_name,
            p.avatar_url,
            COUNT(DISTINCT s.creature_id) as creatures_discovered,
            COALESCE(SUM(c.points), 0) as total_points
        FROM public.profiles p
        LEFT JOIN public.sightings s ON p.id = s.user_id
        LEFT JOIN public.creatures c ON s.creature_id = c.id
        WHERE p.full_name IS NOT NULL AND p.full_name != ''
        GROUP BY p.id, p.full_name, p.avatar_url
    )
    SELECT 
        user_id,
        full_name,
        avatar_url,
        creatures_discovered,
        total_points,
        ROW_NUMBER() OVER (ORDER BY total_points DESC, creatures_discovered DESC) as rank
    FROM user_stats
    ORDER BY total_points DESC, creatures_discovered DESC
    LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert a new profile for the new user
  INSERT INTO public.profiles (id, email, full_name, avatar_url, membership_tier, is_premium, has_seen_onboarding)
  VALUES (
    NEW.id,
    NEW.email,
    NULL,  -- full_name
    NULL,  -- avatar_url
    NULL,  -- membership_tier
    FALSE, -- is_premium
    FALSE  -- has_seen_onboarding
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't stop the signup process
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creatures_updated_at BEFORE UPDATE ON public.creatures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dive_sites_updated_at BEFORE UPDATE ON public.dive_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER handle_updated_at_sightings BEFORE UPDATE ON public.sightings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sightings_updated_at BEFORE UPDATE ON public.sightings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER handle_updated_at_wishlists BEFORE UPDATE ON public.wishlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON public.wishlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


  create policy "allow all 1oj01fe_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'avatars'::text));



  create policy "allow all 1oj01fe_1"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'avatars'::text));



  create policy "allow all 1oj01fe_2"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'avatars'::text));



  create policy "allow all 1oj01fe_3"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'avatars'::text));



