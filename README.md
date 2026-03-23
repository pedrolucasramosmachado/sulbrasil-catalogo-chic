# Sulbrasil Catálogo — High-End Fashion Digital Experience

Este projeto é um catálogo digital premium desenvolvido para a **Sulbrasil**, uma fabricante de moda feminina com foco em qualidade superior. A aplicação oferece uma experiência de navegação fluida, rápida e visualmente impactante, projetada para destacar a sofisticação das peças.

![Sulbrasil Preview](https://catalogo.sulbrasil.com.br/sulbrasil-og-preview.png)

## 🎯 Objetivo do Projeto

Transformar o catálogo físico/PDF da Sulbrasil em uma experiência web interativa, facilitando a consulta de lojistas e clientes finais, com foco em performance e facilidade de manutenção.

---

## 🛠 Case Study: Desafios e Soluções

### 1. Gestão de Ativos de Alta Resolução (Cloudflare R2)
**Desafio:** O catálogo exigia imagens de alta qualidade que prejudicavam o carregamento inicial da página.
**Solução:** Implementação do **Cloudflare R2 Storage** para entrega de assets estáticos via CDN, reduzindo a latência e o custo de banda, além de garantir que as imagens sejam carregadas sob demanda (lazy-loading).

### 2. Sincronização em Tempo Real (Supabase)
**Desafio:** Necessidade de um painel administrativo para atualização rápida de preços e disponibilidade sem redeploy.
**Solução:** Utilização do **Supabase** como backend as a service, permitindo que a equipe da Sulbrasil gerencie o catálogo em tempo real via PostgreSQL, com autenticação segura e Edge Functions para processamento de regras de negócio.

### 3. Arquitetura Escalável (React + TS)
**Desafio:** Garantir um código manutenível e livre de bugs durante a expansão das categorias.
**Solução:** Tipagem rigorosa com **TypeScript** e componentização com **shadcn/ui**, seguindo padrões de design system para consistência visual e facilidade de evolução técnica.

---

## 🚀 Destaques Técnicos

- **Performance Extrema:** Otimização de imagens e uso de Vite para builds ultra-rápidos.
- **UI/UX Premium:** Design minimalista e responsivo, focado na estética da marca.
- **Filtros Avançados:** Busca e filtragem instantânea por categorias.
- **Integração com WhatsApp:** Geração automática de pedidos e dúvidas via link direto.

---

## 📖 Como Rodar o Projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/pedro-leitao/sulbrasil-catalogo-chic.git
   ```

2. **Configure as variáveis:**
   - Copie o `.env.example` para `.env.local`
   - Preencha com as credenciais do seu projeto Supabase e bucket R2.

3. **Instale e rode:**
   ```bash
   npm install
   npm run dev
   ```

---

## 📄 Licença

Projeto desenvolvido para fins comerciais e de portfólio. Todos os direitos de imagem pertencem à Sulbrasil.
