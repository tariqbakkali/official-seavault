ALTER TABLE creatures
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

ALTER TABLE categories
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

ALTER TABLE dive_sites
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

ALTER TABLE sightings
ADD COLUMN updated_at timestamp with time zone DEFAULT now();