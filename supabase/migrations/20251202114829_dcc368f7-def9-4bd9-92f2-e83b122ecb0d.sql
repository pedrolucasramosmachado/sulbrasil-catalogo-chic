-- Adicionar campo de ordenação aos produtos
ALTER TABLE products ADD COLUMN display_order integer;

-- Definir valores iniciais baseados na data de criação (produtos mais antigos primeiro)
UPDATE products 
SET display_order = row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number 
  FROM products
) as numbered 
WHERE products.id = numbered.id;

-- Tornar o campo obrigatório após popular os dados
ALTER TABLE products ALTER COLUMN display_order SET NOT NULL;

-- Criar índice para melhorar performance de ordenação
CREATE INDEX idx_products_display_order ON products(display_order);