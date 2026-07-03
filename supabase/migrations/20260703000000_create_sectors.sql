-- Create sectors table
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for sectors
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read sectors
CREATE POLICY "Sectors are viewable by everyone" 
ON public.sectors 
FOR SELECT 
TO public 
USING (true);

-- Create policy to allow authenticated users to manage sectors
CREATE POLICY "Only authenticated users can manage sectors" 
ON public.sectors 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Add sector_id to categories table if not exists
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL;
