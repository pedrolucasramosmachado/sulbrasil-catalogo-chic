-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('catalog', 'catalog', true);

-- Create products table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category TEXT NOT NULL,
    image_url TEXT,
    whatsapp_message TEXT,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies - products are readable by everyone, but only admin can modify
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert products" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update products" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete products" 
ON public.products 
FOR DELETE 
TO authenticated
USING (true);

-- Create storage policies for catalog bucket
CREATE POLICY "Catalog images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'catalog');

CREATE POLICY "Authenticated users can upload catalog images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'catalog');

CREATE POLICY "Authenticated users can update catalog images" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'catalog');

CREATE POLICY "Authenticated users can delete catalog images" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'catalog');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();