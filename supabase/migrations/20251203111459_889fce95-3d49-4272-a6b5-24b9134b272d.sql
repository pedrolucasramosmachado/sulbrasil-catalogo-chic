-- Criar tabela de categorias para controle de ordem
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update categories" 
ON public.categories 
FOR UPDATE 
USING (true);

CREATE POLICY "Only authenticated users can delete categories" 
ON public.categories 
FOR DELETE 
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Popular tabela com categorias únicas dos produtos (exceto categorias especiais)
INSERT INTO public.categories (name, display_order)
SELECT DISTINCT category, ROW_NUMBER() OVER (ORDER BY category) * 10 as display_order
FROM products
WHERE category NOT LIKE '%Lançamento%'
AND category NOT LIKE '%lançamento%'
AND category NOT LIKE '%Promoção%'
AND category NOT LIKE '%promoção%'
ON CONFLICT (name) DO NOTHING;

-- Limpar categorias confusas de lançamento - mover produtos para categorias corretas
-- "🔥Lançamento Vestidos Celina" -> "Vestidos" com is_launch = true
UPDATE products 
SET category = 'Vestidos', 
    subcategory = 'Vestidos Celina',
    is_launch = true 
WHERE category LIKE '%Lançamento Vestidos Celina%';

-- "Lançamento Naomi 🔥" -> criar categoria apropriada com is_launch = true
UPDATE products 
SET category = 'Naomi', 
    is_launch = true 
WHERE category LIKE '%Lançamento Naomi%';

-- Garantir que a categoria Naomi existe na tabela de categorias
INSERT INTO public.categories (name, display_order)
VALUES ('Naomi', 100)
ON CONFLICT (name) DO NOTHING;