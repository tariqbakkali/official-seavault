-- Create dives table
CREATE TABLE IF NOT EXISTS public.dives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    dive_site_id UUID REFERENCES public.dive_sites(id),
    date DATE NOT NULL,
    time_in TEXT,
    time_out TEXT,
    duration INTEGER,
    max_depth NUMERIC,
    air_in INTEGER,
    air_out INTEGER,
    air_unit TEXT CHECK (air_unit IN ('bar', 'psi')),
    dive_type TEXT CHECK (dive_type IN ('leisure', 'training')),
    course_type TEXT,
    skills_completed JSONB,
    notes TEXT,
    weather TEXT,
    visibility TEXT,
    current TEXT,
    instructor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key to sightings if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sightings' AND column_name = 'dive_id') THEN
        ALTER TABLE public.sightings ADD COLUMN dive_id UUID REFERENCES public.dives(id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.dives ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own dives" ON public.dives
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dives" ON public.dives
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dives" ON public.dives
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dives" ON public.dives
    FOR DELETE USING (auth.uid() = user_id);
