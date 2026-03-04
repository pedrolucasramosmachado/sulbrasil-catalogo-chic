CREATE TABLE public.banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  aspect_ratio text NOT NULL DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16')),
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  link_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Only authenticated users can insert banners" ON public.banners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Only authenticated users can update banners" ON public.banners FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Only authenticated users can delete banners" ON public.banners FOR DELETE TO authenticated USING (true);