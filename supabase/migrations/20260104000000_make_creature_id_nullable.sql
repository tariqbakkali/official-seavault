-- Make creature_id nullable in sightings table
ALTER TABLE "public"."sightings" ALTER COLUMN "creature_id" DROP NOT NULL;

-- Drop existing foreign key constraint if it prevents nulls (though usually FKs allow nulls)
-- Re-adding it just to be safe and ensure it handles nulls correctly (standard behavior)
-- But typically we don't need to drop/add if we just change the column to nullable.
-- However, let's verify if there were any specific constraints. 
-- The previous schema showed: "sightings_creature_id_fkey" FOREIGN KEY (creature_id) REFERENCES creatures(id) ON DELETE CASCADE

-- Double check if we need to do anything else.
-- Just dropping NOT NULL is sufficient for the column.
