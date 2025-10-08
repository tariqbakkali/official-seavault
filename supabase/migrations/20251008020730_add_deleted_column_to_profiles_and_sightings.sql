ALTER TABLE public.profiles
ADD COLUMN deleted boolean DEFAULT false;

ALTER TABLE public.sightings
ADD COLUMN deleted boolean DEFAULT false;