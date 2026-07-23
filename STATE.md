# STATE — Strava Overlay Studio

**Última sessão:** 2026-07-23

## Estado atual

- Fase: design aprovado, implementação não iniciada.
- Spec: `docs/superpowers/specs/2026-07-23-strava-overlay-design.md`.

## Decisões de arquitetura

- React + Vite + TS, SPA 100% estática, deploy Vercel, sem backend.
- Estado: Jotai. Posições de elementos em % (editor e export compartilham modelo).
- Rota: GPX (parser DOMParser nativo) ou Nominatim + OSRM (grátis, sem key).
- Export: canvas offscreen 1080px, PNG transparente, presets story/feed.
- Fora do MVP: FIT/TCX, login, DeepSeek caption.

## Pendências

- [ ] Revisar spec de design — abrir `docs/superpowers/specs/2026-07-23-strava-overlay-design.md`
      | Blocks: início do plano de implementação | Open since: 2026-07-23 (session 1)
- [ ] Definir nome do produto e criar repo GitHub — github.com/new
      | Blocks: deploy Vercel e URL pública | Open since: 2026-07-23 (session 1)
