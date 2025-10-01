supabase gen types typescript --local > types/database1.ts
supabase gen types typescript --project-id hqqebvozpvwpopxtixyt --schema public > types/database2.ts


supabase db dump --data-only --schema public > seed_data.sql