# Trajeto

Gerador de overlays PNG transparentes de atividades esportivas para Instagram Stories. Cole um GPX, busque um trajeto (início → fim), escolha um local ou uma forma pré-definida — e exporte o traçado com stats editáveis, pronto pra sobrepor na sua foto.

**Produção:** https://trajeto-app-flavioricardo91.vercel.app (Deployment Protection ativa no momento — ver STATE.md)

## Funcionalidades

- **Rota por GPX** — parse client-side via DOMParser (Wikiloc e afins: baixar o GPX manualmente)
- **Rota por endereço** — autocomplete Nominatim nos campos início/fim + roteamento OSRM
- **Local** — busca Nominatim com `polygon_geojson`: trilhas (LineString) e praças (Polygon) viram traçado
- **Formas** — 7 formas pré-definidas (coração, estrela, círculo, raio, tênis, joinha, deslike)
- **Editor** — stats arrastáveis e editáveis (distância, tempo, pace…), 5 fontes de overlay, posições em %
- **Export** — PNG transparente via canvas offscreen, Web Share API com fallback de download
- **Strava** — OAuth: importa atividade por link, lista rotas salvas, busca segmentos por região

## Stack

React 18 + Vite + TypeScript (strict) · Jotai · Vitest + RTL (19 testes) · SPA estática na Vercel · Serverless mínimo (`/api/strava-token`, `/api/strava-config`)

## Rodar local

```bash
npm install
npm run dev
```

Build de verificação: `npm run build` (tsc --noEmit + vite build).

## Design

Direção topográfica: papel `#EDEFEC`, tinta `#17201B`, laranja `#FF4D12`. Fontes de overlay: Archivo Black, Bebas Neue, Space Mono, Lora, Caveat. Animações respeitam `prefers-reduced-motion`.

## Documentação

- Estado e pendências: [STATE.md](./STATE.md)
- Specs e planos: `docs/superpowers/`
