# Trajeto — Integração OAuth Strava

**Goal:** bloco "Strava" acima de Rota: conectar conta, importar atividade por link (com confirmação), listar rotas salvas, buscar segmentos por região.

**Arquitetura:** api.strava.com aceita CORS com Bearer token, então o browser fala direto com a API. Serverless só onde o `client_secret` é obrigatório: troca de code e refresh. `client_id` vem de `/api/strava-config` em runtime (evita rebuild ao configurar env).

## Tasks

1. **lib/polyline.ts (TDD):** decode de polyline Google. Vetor de teste oficial `_p~iF~ps|U_ulLnnqC_mqNvxq\`@` → [(38.5,-120.2),(40.7,-120.95),(43.252,-126.453)].
2. **api/strava-token.js + api/strava-config.js (serverless, JS puro):** POST `{code}` ou `{refresh_token}` → repassa a `https://www.strava.com/oauth/token` com `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET` das env vars; config devolve `{clientId}`.
3. **lib/strava.ts:** `parseActivityUrl` (extrai id de strava.com/activities/{id}), `getActivity(id, token)` → polyline + stats; `listRoutes(athleteId, token)`; `exploreSegments(lat, lon, token)` (bounds ±0.05°, activity_type running). Tudo via summary_polyline (sem GPX).
4. **Auth state:** átomo + localStorage `trajeto_strava` {access_token, refresh_token, expires_at, athlete}. Login: redirect para /oauth/authorize (scope `read,activity:read`, redirect_uri = origin). Callback: `?code=` na raiz → troca → limpa query. Refresh automático quando expirado.
5. **StravaPanel (card antes de Rota):** desconectado → botão "Conectar com Strava" (laranja da marca, exigência das guidelines). Conectado → input de link + botão Importar com `window.confirm` mostrando nome e distância antes de aplicar; botão "Minhas rotas" (lista, toque importa); "Segmentos por região" reusa PlaceInput. "Desconectar" limpa storage.
6. **Verificação:** vitest (polyline + parseActivityUrl), tsc, build. Deploy inclui `/api`.

## Pendências humanas criadas
- Registrar app em strava.com/settings/api (callback domain: trajeto-app-flavioricardo91.vercel.app) e configurar `STRAVA_CLIENT_ID` + `STRAVA_CLIENT_SECRET` na Vercel.

## Fora
- GPX export de rotas (summary_polyline basta pro overlay); paginação de rotas além de 30; segmentos de ride.
