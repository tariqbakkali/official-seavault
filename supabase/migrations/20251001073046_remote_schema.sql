


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "icon_name" "text",
    "points" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."creatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creature_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "scientific_name" "text",
    "category_id" "uuid",
    "points" integer NOT NULL,
    "description" "text",
    "habitat" "text",
    "diet" "text",
    "depth_range" "text",
    "length" "text",
    "weight" "text",
    "lifespan" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "class" "text"
);


ALTER TABLE "public"."creatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dive_sites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "latitude" double precision,
    "longitude" double precision,
    "osm_id" "text"
);


ALTER TABLE "public"."dive_sites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "membership_tier" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_premium" boolean,
    "has_seen_onboarding" boolean
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sightings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "creature_id" "uuid",
    "date" timestamp with time zone NOT NULL,
    "dive_notes" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "dive_site_id" "uuid",
    "dive_type" "text",
    "time_of_day" "text",
    "depth" "text",
    "creature_notes" "text"
);


ALTER TABLE "public"."sightings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "creature_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wishlists" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creatures"
    ADD CONSTRAINT "creatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dive_sites"
    ADD CONSTRAINT "dive_sites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sightings"
    ADD CONSTRAINT "sightings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creatures"
    ADD CONSTRAINT "creatures_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sightings"
    ADD CONSTRAINT "sightings_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "public"."creatures"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sightings"
    ADD CONSTRAINT "sightings_dive_site_id_fkey" FOREIGN KEY ("dive_site_id") REFERENCES "public"."dive_sites"("id");



ALTER TABLE ONLY "public"."sightings"
    ADD CONSTRAINT "sightings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "public"."creatures"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


















GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."creatures" TO "anon";
GRANT ALL ON TABLE "public"."creatures" TO "authenticated";
GRANT ALL ON TABLE "public"."creatures" TO "service_role";



GRANT ALL ON TABLE "public"."dive_sites" TO "anon";
GRANT ALL ON TABLE "public"."dive_sites" TO "authenticated";
GRANT ALL ON TABLE "public"."dive_sites" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."sightings" TO "anon";
GRANT ALL ON TABLE "public"."sightings" TO "authenticated";
GRANT ALL ON TABLE "public"."sightings" TO "service_role";



GRANT ALL ON TABLE "public"."wishlists" TO "anon";
GRANT ALL ON TABLE "public"."wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlists" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
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



