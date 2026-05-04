-- Criar tabela de configurações do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL DEFAULT '5511999999999',
    header_text TEXT NOT NULL DEFAULT '🛍️ *PEDIDO*',
    footer_text TEXT,
    show_prices BOOLEAN NOT NULL DEFAULT true,
    show_total BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir configuração padrão se a tabela estiver vazia
INSERT INTO public.whatsapp_settings (phone_number, header_text)
SELECT '5511990000000', '🛍️ *PEDIDO*'
WHERE NOT EXISTS (SELECT 1 FROM public.whatsapp_settings);

-- Adicionar coluna de emoji nas categorias
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS whatsapp_emoji TEXT;

-- Habilitar RLS
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Criar política de leitura pública
CREATE POLICY "Leitura pública para whatsapp_settings" 
ON public.whatsapp_settings FOR SELECT 
TO public 
USING (true);

-- Criar política de edição para autenticados
CREATE POLICY "Edição para administradores" 
ON public.whatsapp_settings FOR ALL 
TO authenticated 
USING (true);
