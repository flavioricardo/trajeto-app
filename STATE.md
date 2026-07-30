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

## Sessão 7 (cont.) — app no ar público

- **Deployment Protection desligada** (`ssoProtection.enabled = false`) com aprovação do Flávio, depois da rotação do secret. Fim do 403: `https://trajeto-app-fmeira.vercel.app/` responde 200 com o HTML do app, e `/api/strava-config` responde sem redirect de SSO.
- **CI/CD por push validado de ponta a ponta:** o push do branch gerou preview (`dpl_91tWTYtKtM7UFUw5XhAVrWThEeBW`) e o merge em main gerou produção (`dpl_7K7BxJxt6MtvPNpBN5EWt5RKRxSy`), ambos READY, com `githubCommitRef` correto. Deploy manual por MCP não é mais necessário.
- **Domínio principal mudou para `trajeto-app-fmeira.vercel.app`.** Isso quebra o OAuth do Strava se não for acompanhado: `StravaPanel` monta `redirect_uri` como `location.origin + location.pathname`, então o Authorization Callback Domain no Strava precisa bater com o domínio por onde o usuário entra. O valor registrado até aqui era `trajeto-app-flavioricardo91.vercel.app`.
- **`/api/strava-config` ainda devolve `null` num deploy posterior a tudo** — ou seja, não é defasagem de env var: `STRAVA_CLIENT_ID` segue ausente ou não numérico na Vercel, e o secret novo do Strava ainda não foi gravado lá.

## Sessão 7 (cont.) — cruzar rota com atividade

- Importação do Strava deixou de substituir tudo. Com o quadro preenchido ela pergunta o que aproveitar: **Substituir tudo**, **Só o traçado** ou **Só os números** (fim do `window.confirm`). Quadro vazio importa direto.
- Caso principal destravado: atividade primeiro (números reais), depois a rota com "Só o traçado" — desenho planejado, esforço real.
- Estatística nova: rota traz `estimated_moving_time`, atividade traz `moving_time`, e a diferença vira `vs. previsto · −7 min`. `ImportResult` ganhou `kind` e `estimatedS`; `importsAtom` guarda a última importação por tipo, então a ordem de importação não importa.
- **Armadilha registrada:** na primeira versão o modo "só o traçado" retornava antes de gravar a importação, e a rota nunca entregava o tempo previsto — o cruzamento morria justamente no fluxo desenhado pra ele. Só apareceu no teste de integração, não nos unitários. Nesse modo o dado agora entra sem derrubar os números existentes.
- **Decisão de escopo:** sobrepor os dois traçados pra comparar aderência ficou de fora. Exigiria normalizar contra um bounding box comum (`normalizePoints` escala cada conjunto na própria caixa, então dois traçados quase idênticos sairiam desalinhados) e trocar `routeAtom`/`renderOverlay` pra coleção. É análise de treino, não overlay de story.
- 28 testes (9 novos), build 59,4 kB gzip.

## Sessão 8 (2026-07-30) — formas de modalidade

- **Rota passou a ser `Trace = Pt[][]`** (subcaminhos). Ícone de esporte é traço solto — cabeça separada do tronco, duas rodas na bicicleta — e o modelo antigo de polilinha única ligaria as partes com um risco. Editor e `renderOverlay` desenham `moveTo` por subcaminho; GPX/Strava/local entram como `[pontos]`.
- **Formas param de ser desenhadas à mão.** Três tentativas de silhueta de tênis provaram que não dá. Agora vêm de ícones amostrados em polilinha por `scripts/gen-shapes.mjs`, que usa `getPointAtLength` no Chromium e grava `src/lib/shapes-icons.ts` (gerado, não editar).
- **Fontes e licenças:** decorativas do **Feather** (MIT, já é a família da interface); modalidades e o tênis do **Tabler** (MIT), porque o Feather **não tem nenhum ícone de esporte** — conferido, 0 de 287. Tabler nasceu na mesma grade 24×24 com traço 2, então as duas convivem. Levantamento feito: Tabler 23/23 modalidades, Phosphor 19/20, Lucide só objetos.
- **Ícones do Strava estão fora**: arte proprietária e brand guidelines restritivas. Aproveitamos a taxonomia de modalidades, não o desenho.
- 12 modalidades (Corrida, Pedal, Natação, Caminhada, Trilha, Musculação, Yoga, Skate, Remo, Esqui, Futebol, Vela) e 7 decorativas, agrupadas na aba com rótulo.
- **Combate (sessão 8, cont.):** Luta (Tabler `karate`), Boxe (**Iconoir**, MIT — o Tabler só tem `karate` de combate) e Esgrima (Tabler `swords`). 15 modalidades.
- **Regra pra escolher fonte de ícone daqui pra frente: tem que ser de traço.** Phosphor e Material Symbols têm ótima cobertura de esporte, mas os ícones são preenchidos (`fill`), e traçar um preenchido desenha o *contorno* da forma — sai com linha dupla e destoa das figuras de linha única. Foi por isso que o Phosphor ficou de fora apesar dos 19/20.
- **Custo:** bundle de 60,0 → 74,5 kB gzip. Se apertar, o passo de amostragem (`STEP` no gerador) é a alavanca — 0,45 hoje.
- Armadilha registrada: um `path` pode ter subcaminhos soltos (o `ThumbsDown` do Feather tem), e `getPointAtLength` os percorre em sequência. O gerador corta onde a distância entre amostras vizinhas estoura o passo, senão sai um risco ligando polegar e punho.

## Sessão 9 (2026-07-30) — temas

- **Temas pintam o conteúdo do quadro**: Nenhum, 3D, Medieval, Futurista e Fofo. Escolher um tema aplica paleta e fonte no `styleAtom`, então os controles de Estilo seguem valendo pra ajustar depois.
- **Traço em camadas** (`RouteLayer[]`, de baixo pra cima). É o que permite extrusão 3D (cópias deslocadas), contorno (camada grossa embaixo) e néon (halo largo + núcleo fino). As camadas usam tokens (`route`, `routeDark`, `routeLight`), então acompanham a cor que o usuário escolher em vez de travar numa cor do tema.
- **Toda medida do tema é % da largura do quadro.** No editor isso vira `cqw` (o `.editor` declara `container-type: inline-size`) e unidades de viewBox; no canvas vira pixel. É o que mantém editor e PNG iguais.
- **Bug corrigido de quebra:** o editor usava fator fixo `1.4` pra espessura, que só batia com o export quando a caixa da rota estava no tamanho padrão. Agora converte por `100 / box.size`. Redimensionar a rota não desalinha mais editor e PNG.
- **Armadilha achada comparando o PNG com o editor:** `-webkit-text-stroke` e `strokeText` **centram** o traço na letra. Eu tinha dobrado a largura no canvas, e o contorno saía 2× mais grosso no PNG. Só apareceu porque exportei e comparei — nenhum teste pegava.
- **Hello Kitty ficou fora: marca registrada da Sanrio.** O tema kawaii é original (Fofo), sem personagem e sem o nome. Há teste que falha se "kitty" ou "sanrio" aparecer nos temas.
- Fontes do Google não carregam neste sandbox (proxy bloqueia `fonts.googleapis.com`), então a troca de fonte por tema não aparece nas capturas daqui — mas o `font-family` computado muda, e em produção carrega.
- **Sessão 9 (cont.):** Fofo trocou a Caveat pela **Fredoka** (fonte nova no app, arredondada — a lista não tinha nada de fato fofo) e ganhou halo de brilho no traço e no texto. Tema **Carimbo** entra: tinta única (texto na mesma cor do traço), batida deslocada e translúcida por cima, Bebas Neue condensada.
- Armadilha do Fofo com contorno **e** brilho: no canvas a sombra ia no contorno e de novo no preenchimento, empilhando o brilho. O `text-shadow` do editor envolve o conjunto uma vez só, então a sombra agora acompanha só o contorno, que é a forma mais externa.
- **Sessão 9 (cont. 2):** Fofo passa da Fredoka pra **Baloo 2**, bem mais bojuda (a Fredoka é arredondada mas moderada; ficou disponível no seletor). Carimbo ganha o que faltava pra ler como carimbo: **anéis de moldura**, **tinta corroída** e **impressão torta**.
- O modelo de tema cresceu três campos pra isso: `dash`/`dashOffset` na camada (corrosão), e `frame` + `contentScale` + `rotate` no tema. `themedTrace()` monta o traçado final e é chamada **pelo editor e pelo export**, então moldura e encolhimento não têm como divergir.
- Sobre o padrão de corrosão: começou grosso e leu como tracejado intencional. Carimbo real tem falha fina e frequente — o padrão atual é curto e irregular, e cada camada usa um `dashOffset` diferente pra que as falhas não coincidam.
- A animação de desenhar a rota usa `dasharray`, então ela sai de cena quando o tema corrói a tinta (que também é `dasharray`). Conflito conhecido, não bug.
- 69 testes, bundle 74,5 → 76,4 kB gzip.

## Pendências

- [x] Revisar spec de design — resolvido 2026-07-23 (aprovação delegada, session 2)
- [x] Definir nome do produto — resolvido 2026-07-23: Traço (session 2)
- [x] Criar repo GitHub `trajeto-app` e dar push — resolvido 2026-07-23 (session 2)
- [x] Token PAT `trajeto-push` — encerrado 2026-07-30 (session 7) por decisão do Flávio: deixar expirar em vez de revogar, já que os tokens estão perto da data de expiração. Aberta desde 2026-07-23 (5 sessões).
- [x] Deploy Vercel — resolvido 2026-07-23 via MCP `deploy_to_vercel`, build ok (session 2)
- [x] Rotacionar client secret do Strava — resolvido 2026-07-30 (session 7), secret novo gerado. Invalida o vazamento da session 5.
- [x] Conectar o repo GitHub na Vercel — resolvido 2026-07-30 (session 7). Deploy por push, sem mais MCP manual.
- [x] Desligar a Deployment Protection — resolvido 2026-07-30 (session 7), `ssoProtection.enabled = false`. App público em https://trajeto-app-fmeira.vercel.app/ (200 verificado). Aberta desde 2026-07-23, 5 sessões.
- [ ] Gravar STRAVA_CLIENT_ID (numérico) e STRAVA_CLIENT_SECRET (o novo) na Vercel — https://vercel.com/flavioricardo91/trajeto-app/settings/environment-variables — **e** apontar o Authorization Callback Domain para `trajeto-app-fmeira.vercel.app` — https://www.strava.com/settings/api
      | Blocks: botão Conectar com Strava. Confirmado em 2026-07-30 que `/api/strava-config` devolve `null` num deploy posterior à rotação, então não é defasagem de deploy: as duas variáveis não estão gravadas na Vercel.
      | Por que o callback mudou: o app passou a rodar em `trajeto-app-fmeira.vercel.app` e o `redirect_uri` é montado a partir do `location.origin`. Se o domínio do Strava não bater com aquele por onde o usuário entra, o OAuth é recusado.
      | Depois de gravar: as env vars só valem no deploy seguinte. Com o Git conectado, qualquer push em main já republica.
      | Como validar: abrir https://trajeto-app-fmeira.vercel.app/api/strava-config — tem que vir um número no `clientId`. `null` = ausente ou não numérico (o guard rejeita).
      | Open since: 2026-07-24 (session 4)
