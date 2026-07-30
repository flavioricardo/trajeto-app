# STATE — Trajeto (trajeto-app)

**Última sessão:** 2026-07-30 (session 7)

## Estado atual

- MVP implementado e verificado: 12 testes Vitest+RTL passando, `tsc --noEmit` limpo, `vite build` ok (54,7 kB gzip).
- Nome do produto: **Trajeto** (renomeado de Traço a pedido do Flávio, session 2).
- Spec: `docs/superpowers/specs/2026-07-23-strava-overlay-design.md`
- Plano: `docs/superpowers/plans/2026-07-23-traco-mvp.md`

## Sessão 3 (2026-07-24)

- Tab "Local" restaurada do jeito certo: Nominatim `polygon_geojson=1` devolve geometria do lugar (trilha LineString, praça Polygon) → vira traçado; distância pré-preenchida quando linear. Correção da decisão da session 2 que colapsou "Buscar local" em A→B.
- Tab "Formas": 7 formas pré-definidas (coração, estrela, círculo, raio, tênis, joinha, deslike) como polylines 0-1 em `src/lib/shapes.ts`.
- Xadrez do editor escurecido (#a9afa9/#c3c8c2) pra leitura de stats claros.
- 17 testes. Redeploy produção via MCP: dpl_9bBBoE4kv5GvG47VAWG8qyLhjqiw.
- Fix drag de stats: pointer capture no bloco (currentTarget), stopPropagation removido dos spans editáveis. Ícones SVG inline (icons.tsx). Copy revisada com humanizer (sem travessões na UI, sem rule-of-three, Wikiloc citado como fonte de GPX). Wikiloc: sem API pública e ToS proíbe re-hospedagem; caminho oficial é download manual do GPX. Redeploy: dpl_9Nr62tGpsw4xhUpdqkCHaz5uqUYJ.
- **DeepSeek avaliado (2ª vez) para rotas/locais: fora.** LLM não tem geometria geográfica (alucina coordenadas) e não substitui Nominatim/OSRM. Único uso real seria sugerir termos alternativos de busca quando o Nominatim retorna vazio, mas exige função serverless + key + custo por chamada num produto grátis. Reavaliar só se reclamações de cobertura persistirem com usuários reais; nesse caso, endpoint único `/api/sugerir-busca` com rate limit por IP.

## Decisões de arquitetura

- React + Vite + TS, SPA estática, Jotai, posições em % (editor e export compartilham modelo).
- Rota: GPX (DOMParser) ou Nominatim + OSRM. **Mudança vs spec:** tab "Buscar local" isolada não gera traço — colapsada em "Início e fim" com autocomplete Nominatim nos dois campos (registrado no plano, self-review).
- Export: canvas offscreen, `document.fonts.load` antes de desenhar, Web Share API com fallback download.
- Design: direção topográfica (papel #EDEFEC, tinta #17201B, laranja #FF4D12), fontes de overlay: Archivo Black, Bebas Neue, Space Mono, Lora, Caveat. Assinatura: curvas de nível no header + rota se desenhando (respeita prefers-reduced-motion).
- ponytail: debounce 800ms cobre rate limit Nominatim; fila de requisições só se precisar.

## Sessão 4 (2026-07-24)

- OAuth Strava implementado (plano em docs/superpowers/plans/2026-07-24-strava-oauth.md): StravaPanel acima de Rota; importa atividade por link (confirmação via window.confirm), lista rotas salvas, busca segmentos por região (Nominatim → bounds → segments/explore). Browser fala direto com api.strava.com (CORS ok); serverless só em /api/strava-token (secret) e /api/strava-config (clientId em runtime, sem rebuild). Token em localStorage com refresh automático.
- Ícones migrados pra lucide-react. Botão "Adicionar dado". 19 testes.
- Limitação documentada: rotas sugeridas "Made for you" não vêm na API; usuário salva a rota no app do Strava e ela aparece em "Minhas rotas".

## Sessão 5 (2026-07-25)

- Incidente de configuração: STRAVA_CLIENT_ID foi preenchido com o valor do client secret e o endpoint público o expunha (mitigado: Deployment Protection ativa limitou o vazamento a usuários autenticados no projeto; guard deployado — strava-config só devolve valor numérico). Secret também está no histórico do chat e NÃO foi rotacionado. Deploy do guard: dpl_6UrXHsJ1JACdoLwBZHRGNDAb1cZp.
- Confirmado por SSO redirect: Deployment Protection segue ATIVA (app inacessível ao público).

## Sessão 7 (2026-07-30)

- Ícones migrados de lucide-react para **Feather** (`react-feather`, MIT). `X`, `Plus` e `Download` são equivalentes diretos; `MoveDiagonal` virou `Maximize2` (handle de resize). Só `src/components/icons.tsx` mudou — os componentes importam tudo por lá. 19 testes, `tsc --noEmit` limpo, build 58,9 kB gzip.
- PR #1 criado e mergeado por squash em main (`5e106ee`). Primeiro PR do repo.
- Deploy de produção via MCP: `dpl_2jRwnrpJ3AYttSfWQf2AZi1MqG2F` (READY). A primeira tentativa (`dpl_B8AqBK…`) falhou com "Could not resolve ./styles.css" — `deploy_to_vercel` sobe uma árvore de arquivos explícita e o CSS ficou de fora. Ao deployar por MCP, conferir a lista contra `find src api -type f`.
- Estado verificado por API nesta sessão: `ssoProtection.enabled = true` (deployments sem domínio próprio seguem fechados ao público) e `/api/strava-config` devolve `{"clientId":null}` (env var ausente ou ainda não numérica). Projeto Vercel continua sem link com o repo GitHub, então todo deploy é manual.

## Pendências

- [x] Revisar spec de design — resolvido 2026-07-23 (aprovação delegada, session 2)
- [x] Definir nome do produto — resolvido 2026-07-23: Traço (session 2)
- [x] Criar repo GitHub `trajeto-app` e dar push — resolvido 2026-07-23 (session 2)
- [ ] REVOGAR token PAT `trajeto-push` — ⚠️ **5 sessões aberta, violando a regra das 2 sessões** — https://github.com/settings/personal-access-tokens
      | Blocks: segurança — token com write vive no histórico do chat | Open since: 2026-07-23 (confirmada ainda aberta em 2026-07-30, session 7)
- [x] Deploy Vercel — resolvido 2026-07-23 via MCP `deploy_to_vercel`, build ok (session 2)
- [ ] ROTACIONAR client secret do Strava (https://www.strava.com/settings/api), **e só então** desligar a Deployment Protection e conectar o repo GitHub (https://vercel.com/flavioricardo91/trajeto-app/settings)
      | Blocks: acesso público (403) e CI/CD por push — mas a ordem importa: a Deployment Protection é o que hoje contém o vazamento do secret (session 5), que segue **não rotacionado**. Desligar antes de rotacionar reabre a exposição.
      | Open since: 2026-07-23 (session 2; `ssoProtection.enabled = true` confirmado por API em 2026-07-30)
      | Nota: `/api/strava-config` devolve `null`, o que significa env var ausente **ou** ainda com o valor do secret colado por engano — o guard esconde os dois casos. Conferir o valor real ao rotacionar.
- [ ] Registrar app no Strava e configurar env vars — https://www.strava.com/settings/api (Authorization Callback Domain: trajeto-app-flavioricardo91.vercel.app), depois STRAVA_CLIENT_ID e STRAVA_CLIENT_SECRET em https://vercel.com/flavioricardo91/trajeto-app/settings/environment-variables
      | Blocks: botão Conectar com Strava funcionar | Open since: 2026-07-24 (session 4; `/api/strava-config` devolvia `{"clientId":null}` em 2026-07-30)
