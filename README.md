# Sulbrasil Catálogo — Moda Feminina Premium

Catálogo digital oficial da **Sulbrasil**, desenvolvido com React + Vite + TypeScript e integrado ao Supabase.

## Tecnologias

- **React 18** + **TypeScript**
- **Vite 5**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (banco de dados e storage de imagens)
- **React Router DOM** (navegação)
- **TanStack Query** (gerenciamento de estado assíncrono)

## Como rodar localmente

```sh
# 1. Clone o repositório
git clone <URL_DO_REPO>

# 2. Entre na pasta
cd sulbrasil-catalogo-chic

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

O servidor sobe em `http://localhost:8082`.

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon pública do Supabase |

## Scripts disponíveis

```sh
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de produção
npm run preview   # Preview do build
npm run lint      # Linting com ESLint
```

## Deploy

O projeto pode ser publicado em qualquer plataforma de hospedagem estática (Netlify, Vercel, Cloudflare Pages, etc.).

```sh
npm run build
# Faça o deploy da pasta /dist
```
