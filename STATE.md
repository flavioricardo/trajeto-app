# STATE — Traço (traco-app)

**Última sessão:** 2026-07-23 (session 2)

## Estado atual

- MVP implementado e verificado: 12 testes Vitest+RTL passando, `tsc --noEmit` limpo, `vite build` ok (54,7 kB gzip).
- Nome do produto decidido: **Traço** (loop de decisão PM, session 2).
- Spec: `docs/superpowers/specs/2026-07-23-strava-overlay-design.md`
- Plano: `docs/superpowers/plans/2026-07-23-traco-mvp.md`

## Decisões de arquitetura

- React + Vite + TS, SPA estática, Jotai, posições em % (editor e export compartilham modelo).
- Rota: GPX (DOMParser) ou Nominatim + OSRM. **Mudança vs spec:** tab "Buscar local" isolada não gera traço — colapsada em "Início e fim" com autocomplete Nominatim nos dois campos (registrado no plano, self-review).
- Export: canvas offscreen, `document.fonts.load` antes de desenhar, Web Share API com fallback download.
- Design: direção topográfica (papel #EDEFEC, tinta #17201B, laranja #FF4D12), fontes de overlay: Archivo Black, Bebas Neue, Space Mono, Lora, Caveat. Assinatura: curvas de nível no header + rota se desenhando (respeita prefers-reduced-motion).
- ponytail: debounce 800ms cobre rate limit Nominatim; fila de requisições só se precisar.

## Pendências

- [x] Revisar spec de design — resolvido 2026-07-23 (aprovação delegada, session 2)
- [x] Definir nome do produto — resolvido 2026-07-23: Traço (session 2)
- [ ] Criar repo GitHub `traco-app` e dar push — https://github.com/new
      | Blocks: deploy e histórico remoto | Open since: 2026-07-23 (session 2)
- [ ] Importar na Vercel e deployar — https://vercel.com/new
      | Blocks: URL pública | Open since: 2026-07-23 (session 2)
- [ ] Testar drag/export em celular real (touch + salvar na galeria via share sheet) — abrir preview no celular
      | Blocks: validação mobile-first | Open since: 2026-07-23 (session 2)
