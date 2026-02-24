
-- Add display fields to products for WhatsApp formatting
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS display_emoji text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS model_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color_name text DEFAULT NULL;

-- Create orders table to store received orders
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text NOT NULL,
  items jsonb NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  total_pieces integer NOT NULL DEFAULT 0,
  is_wholesale boolean NOT NULL DEFAULT false,
  whatsapp_message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders viewable by authenticated users only
CREATE POLICY "Only authenticated users can view orders"
ON public.orders FOR SELECT
USING (auth.role() = 'authenticated');

-- Orders can be inserted by anyone (customers)
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

-- Only authenticated users can update orders
CREATE POLICY "Only authenticated users can update orders"
ON public.orders FOR UPDATE
USING (auth.role() = 'authenticated');

-- Only authenticated users can delete orders
CREATE POLICY "Only authenticated users can delete orders"
ON public.orders FOR DELETE
USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
