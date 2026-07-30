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

## Sessão 7 (cont.) — ações do Flávio

- **Git do projeto conectado na Vercel.** Conectar não dispara deploy sozinho: o próximo push em main é que vira o primeiro deploy automático. Até lá a produção seguia no `dpl_2jRwnrpJ3AYttSfWQf2AZi1MqG2F` (deploy manual por MCP).
- **Client Secret do Strava rotacionado.** Isso invalida o secret vazado na sessão 5 e destrava a Deployment Protection: agora dá pra abrir o app ao público sem reabrir a exposição.
- **PAT `trajeto-push`:** encerrado por decisão do Flávio — os tokens estão perto da data de expiração e ele optou por deixar expirar em vez de revogar. Registrado como expiração, não revogação: o token mantém escrita até a data.
- ⚠️ **Env var só vale a partir do próximo deploy.** A Vercel injeta as variáveis no build/deploy; mudá-las depois não afeta funções já publicadas. `/api/strava-config` continuava devolvendo `null` às 13:50 porque a produção era anterior à configuração. Qualquer troca de env var exige redeploy.

## Pendências

- [x] Revisar spec de design — resolvido 2026-07-23 (aprovação delegada, session 2)
- [x] Definir nome do produto — resolvido 2026-07-23: Traço (session 2)
- [x] Criar repo GitHub `trajeto-app` e dar push — resolvido 2026-07-23 (session 2)
- [x] Token PAT `trajeto-push` — encerrado 2026-07-30 (session 7) por decisão do Flávio: deixar expirar em vez de revogar, já que os tokens estão perto da data de expiração. Aberta desde 2026-07-23 (5 sessões).
- [x] Deploy Vercel — resolvido 2026-07-23 via MCP `deploy_to_vercel`, build ok (session 2)
- [x] Rotacionar client secret do Strava — resolvido 2026-07-30 (session 7), secret novo gerado. Invalida o vazamento da session 5.
- [x] Conectar o repo GitHub na Vercel — resolvido 2026-07-30 (session 7). Deploy por push, sem mais MCP manual.
- [ ] Desligar a Deployment Protection — https://vercel.com/flavioricardo91/trajeto-app/settings/deployment-protection (Vercel Authentication → Disabled)
      | Blocks: acesso público — `ssoProtection.enabled = true` confirmado por API em 2026-07-30, então o app segue fechado (SSO) em todos os domínios `.vercel.app`.
      | Open since: 2026-07-23 (session 2). O bloqueio de segurança que segurava essa ação (secret não rotacionado) caiu com a rotação de 2026-07-30.
- [ ] Conferir STRAVA_CLIENT_ID e STRAVA_CLIENT_SECRET na Vercel e **redeployar** — https://vercel.com/flavioricardo91/trajeto-app/settings/environment-variables (Authorization Callback Domain no Strava: trajeto-app-flavioricardo91.vercel.app)
      | Blocks: botão Conectar com Strava funcionar. `/api/strava-config` devolvia `{"clientId":null}` às 13:50 de 2026-07-30 — env var ausente **ou** produção anterior à configuração, porque env var só entra em vigor no deploy seguinte.
      | Como validar: abrir `/api/strava-config` depois do redeploy. Tem que vir um número no `clientId`; `null` significa que o CLIENT_ID não é numérico (o guard rejeita) ou não está setado.
      | Open since: 2026-07-24 (session 4)
