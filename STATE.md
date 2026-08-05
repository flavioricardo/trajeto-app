# STATE — Storyline (repo `trajeto-app`)

**Última sessão:** 2026-08-05 (session 13)

## Estado atual

- MVP implementado e verificado: 12 testes Vitest+RTL passando, `tsc --noEmit` limpo, `vite build` ok (54,7 kB gzip).
- Nome do produto: **Storyline** (Traço → Trajeto na session 2, Trajeto → Storyline na session 12). O repo, o projeto na Vercel e o domínio continuam `trajeto-app` de propósito — ver session 12.
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
- **Sessão 9 (cont. 3):** Carimbo com **Rubik Doodle Shadow**, traço de 1,5 → 2,4 e paleta mais densa (`#8E241D`, camadas menos translúcidas). Sombra própria do texto removida: a fonte já traz sombra no desenho da letra, e somar outra sujava.
- **Duas armadilhas do traço grosso com corrosão**, ambas achadas olhando:
  1. **Ponta arredondada fecha a lacuna.** Ela avança meia espessura além de cada traço, então num traço grosso as fendas somem. Camada com `dash` passa a usar ponta reta — que aliás é mais parecido com tinta rasgada.
  2. **`dash` em % fixa vira conta de colar.** Com a linha grossa, trechos da ordem da própria espessura viram quadradinhos. O `dash` agora é **múltiplo da espessura da camada**, então acompanha o controle de traço do usuário em vez de quebrar quando ele mexe. Tem teste que falha se voltar a ser absoluto.
- 71 testes, bundle 74,5 → 76,4 kB gzip.

## Sessão 10 (2026-07-30) — foto de fundo

- Usuário escolhe uma foto que entra atrás do overlay. **Nada sobe pro servidor**: `URL.createObjectURL` aponta pra memória da aba, não há `fetch` nem `localStorage`, e o object URL morre quando a aba fecha. É garantia por construção, não por política — não existe endpoint pra apagar depois.
- O object URL anterior é revogado na troca e na remoção, senão o blob fica preso na memória da aba.
- **Export com foto vira JPEG** (`0.92`), porque não há transparência pra preservar e PNG de foto é enorme. Sem foto, segue o PNG transparente de sempre. Um checkbox permite voltar ao PNG transparente mesmo com foto no quadro — útil pra quem só quer conferir contraste e montar no Instagram.
- Editor e export usam o mesmo recorte `cover` (`coverRect`), então a prévia é fiel: o CSS `object-fit: cover` e o `drawImage` com recorte de origem concordam porque o quadro tem a proporção do preset.
- Verificado no navegador que a única requisição com a foto é o próprio `blob:` — leitura da memória do navegador, não rede.
- 78 testes, bundle 76,5 → 77,2 kB gzip.

## Sessão 11 (2026-07-30) — link curto e outras modalidades

- **Link curto (`strava.app.link`) agora funciona.** O navegador não resolve sozinho: é deep link do Branch e não devolve CORS, então o `fetch` é bloqueado. Quem segue o redirect é o serverless novo `api/strava-resolve.js`.
  - **Allowlist estrita de host** nesse endpoint: ele busca uma URL que veio do usuário, e sem isso viraria proxy pra qualquer destino (inclusive metadata interna). Coberto por teste com host parecido, sem TLS e IP de metadata.
  - Ele tenta o id na URL final **e** no corpo, porque o Branch às vezes responde página em vez de redirect, dependendo do User-Agent.
- `parseActivityUrl` ficou tolerante: com/sem protocolo, com `www`, com sufixo `/overview`, com query, com espaço em volta, id solto, e caixa alta.
- **Atividade sem mapa deixou de ser erro.** Musculação, yoga e esteira têm dados mas não têm traçado — antes o app recusava com "Essa atividade não tem mapa". Agora importa os dados e usa a **forma da modalidade** no lugar do traçado (`SPORT_SHAPE` liga o `sport_type` do Strava às 15 formas).
- **Métricas novas:** FC média e máxima, calorias, esforço relativo, potência e cadência. Tudo condicional, porque as modalidades divergem: emitir `0,00 km` numa musculação seria ruído.
- **Ritmo por modalidade:** pedal em km/h, natação por 100 m, resto em min/km. Pace de bicicleta em min/km não é leitura de ninguém.
- Slots de estatística passaram de 5 pra 8, em duas colunas — as métricas novas não cabiam numa coluna só.
- `allowJs` no tsconfig pra o teste conseguir importar o handler serverless, que é JS puro.
- 94 testes, bundle 77,2 → 78,2 kB gzip.

## Sessão 11 (cont.) — bug do download que sumia

- **Sintoma:** botão piscava "Gerando…" e nenhum arquivo aparecia. O Flávio notou depois de remover a foto de fundo, mas a causa não é a foto.
- **Causa:** `navigator.share(...).catch(() => {})` engolia toda falha e **não havia caminho alternativo**. O `share` exige ativação recente do clique, e ela expira enquanto o canvas renderiza 1080×1920 — aí rejeita com `NotAllowedError` e o app não fazia nada.
- Não reproduz em Chromium headless, onde `canShare` é indefinido e o fluxo já ia pro download. Reproduzi injetando um `share` que rejeita, que é o comportamento do navegador real.
- **Correção:** falha de share cai pro download. `AbortError` é exceção — fechar a folha de compartilhamento é escolha do usuário, e baixar seria atropelar.
- Junto: erro de geração agora aparece na barra em vez de sumir; o link do download entra no documento antes do clique (navegador exige) e o object URL é revogado com atraso, porque revogar na hora corre com o download e trunca arquivo.
- O rótulo do botão passa a dizer JPG quando é JPG que vai sair.
- 99 testes, bundle 78,2 → 78,3 kB gzip.

## Sessão 12 (2026-07-30/31) — Carimbo no desenho da própria fonte

- O traço do Carimbo passa a imitar a **Rubik Doodle Shadow**. Anéis de moldura removidos — competiam com o desenho em vez de emoldurar.
- **Parei de adivinhar a fonte.** O navegador não alcança o Google Fonts pelo proxy, mas o `curl` sim: baixei o TTF, rendi um espécime ampliado e só então vi como a letra é feita. Duas tentativas antes disso (cópia deslocada; hachura diagonal) erraram por chute.
  - A letra é **contorno fino e vazado**, com o fundo à mostra no miolo.
  - A sombra é **risco de caneta perpendicular à borda**, pendurado embaixo e à esquerda. Não é cópia deslocada nem hachura em diagonal fixa: em borda vertical o risco sai horizontal, em borda horizontal sai vertical.
- **Capacidade `carve` (do tema, não da camada):** fração do miolo removida da linha, deixando as duas bordas. O vazio limpa **todas** as camadas de dentro — é o interior da letra, que não mostra nem a sombra de trás.
  - Editor: `<mask>` no `<g>` inteiro.
  - Export: a pilha vai num canvas próprio e leva um `destination-out` só no fim, e aí é composta no canvas final. Direto no canvas final o vazio furaria a foto. Verificado com foto: a foto aparece pelo miolo, intacta.
- **Capacidade `ticks` (da camada):** o `strokeDasharray` corta o traço em tracinhos, e como o traço é grosso cada tracinho sai **atravessado** nele — perpendicular à rota, de graça, sem calcular normal nenhuma. A camada de cima cobre o meio dos riscos; sobra só a ponta que passa da borda, que é a sombra.
  - Ponta reta obrigatória: a redonda estica cada tracinho por meia espessura e fecha os vãos.
  - Densidade ajustada depois: risco 0,26/vão 0,34 lia como pente. Passou pra 0,17/0,19 — vão quase igual ao risco, que é a densidade da própria fonte e o que dá o aspecto de lápis.
  - O dasharray já era usado pela animação de desenho. Pra não escolher entre as duas coisas, a animação da camada riscada saiu pra uma `<mask id="reveal">` — um traço largo que se revela ao longo da rota.
- **Limpeza junto:** `dash`/`dashOffset`, `frame`/`contentScale`/`themedTrace` e o `hollow` por camada saíram. Sem tema usando, viravam caminho de renderização morto nos dois renderizadores.
- 101 testes, bundle 78,3 → 78,4 kB gzip.
- **Produção verificada:** `https://trajeto-app-fmeira.vercel.app/` responde 200 e o CSS servido traz `.route-path,.route-reveal{animation:draw…}`, que só existe depois desta mudança. Deploy `dpl_As6veshWQz9MLv5kRmgNzL3CpN1z` (sha `12ebc40`), READY.

### Duas armadilhas de processo desta sessão

- **`curl` na produção falha com 403 no túnel** — é o proxy da sessão, não o app. Quem alcança o domínio é o MCP da Vercel (`web_fetch_vercel_url`). Não confundir com app fora do ar.
- **PR mergeado por squash faz o branch conflitar com o main inteiro** na mudança seguinte: o main tem um commit espremido e o branch ainda tem os originais, então os mesmos arquivos conflitam em bloco. Depois de cada merge, `git checkout -B <branch> origin/main`. Se acontecer, o lado do branch é o certo — mas confira com `git diff <branch> origin/main` que o main não trazia nada além disso antes de resolver em massa.

## Sessão 12 (cont.) — Trajeto vira Storyline

- **Por que:** "Trajeto" prometia rota, e rota virou uma das fontes entre forma, modalidade, dado manual e foto. O nome ficou menor que o produto.
- **Storyline** escolhido pelo Flávio: `story` é o formato do Instagram e `line` é o traço que o app desenha. Pedido dele que fosse em inglês e que conectasse Strava e Instagram, que é onde o overlay é usado.
- **Descartados por marca registrada**, mesma lógica que tirou a Hello Kitty do tema kawaii: nome com "Strava" dentro (os termos de API proíbem sugerir endosso) e com "-gram"/"Insta-" (a Meta persegue). "Kudos" sozinho também: é palavra comum, mas no contexto fitness lê como vocabulário do Strava, e é justamente aí que implica afiliação.
- Conflito conhecido e aceito: existe o **Articulate Storyline**, software de e-learning. Categoria software, mercado diferente, app grátis sem fim comercial.
- **Alcance da troca: só a marca visível** — título, header, tagline, meta description, nome do arquivo baixado e o texto do quadro vazio, que ainda mandava "escolha a rota". Repo, projeto Vercel e domínio ficam como estão: renomear o projeto muda o domínio de produção, e o `redirect_uri` do Strava sai do `location.origin`. Mexer aí sem atualizar o Authorization Callback Domain no mesmo momento quebra o botão Conectar, que foi a pendência de 4 sessões.
- `STORAGE_KEY` do Strava segue `trajeto_strava`, com comentário explicando: renomear desconectaria quem já autorizou, e a chave não aparece pra ninguém.

## Sessão 12 (cont.) — idioma duplo, pt-BR e inglês

- **Um dicionário só**, `src/i18n.ts`, com tupla `[pt, en]` por entrada. Ver os dois lado a lado é o que torna revisão de tradução possível, e o `satisfies` no fim quebra o build se faltar um dos dois.
- Fora dali não sobra texto de interface. **As bibliotecas lançam a chave como mensagem de erro** e quem mostra é que traduz (`errorText`). O que vem de fora (rede, navegador) passa como está: engolir seria pior que mostrar em inglês.
- **Detecção pelo `navigator.language`**, escolha manual no canto do header, persistida em `storyline_lang`. O `<html lang>`, o `<title>` e a meta description acompanham.
- **O `StatElement` ganhou `key`**, que diz de qual rótulo do dicionário o texto veio. É o que permite reescrever os rótulos na troca de idioma — e eles vão pra imagem exportada, então isso é o ponto da feature, não detalhe. **Renomear o rótulo à mão apaga a chave:** dali em diante o texto é do usuário e o idioma não mexe mais nele.
- **O valor não dá pra reformatar pela origem**, porque o elemento guarda só o texto. Muda só o separador decimal (`localizeNumbers`), que é a única diferença entre pt e en nos formatos que o app produz — "1h 13m", `15'03"/km` e as unidades se escrevem igual.
- `ThemeId` virou união fechada, então `theme.<id>.label` é verificado em tempo de compilação: tema novo sem tradução não compila.
- **Os testes fixam o idioma em pt** num `setupFiles`. Sem isso a suíte passaria a depender do locale da máquina — em CI vem `en-US` e todo `getByText` em português quebraria. O inglês tem teste próprio, que troca pela interface.
- Unidade continua métrica nos dois idiomas. Milha é decisão de unidade, não de idioma (brasileiro não quer milha, inglês pode querer km), então seria um controle à parte.
- 113 testes, bundle 78,4 → 82,1 kB gzip.

## Sessão 12 (cont.) — três defeitos visuais

Avaliação a pedido do Flávio. A direção topográfica (papel, tinta, laranja, curvas de nível) está boa e **não foi redesenhada** — o que estava errado eram três coisas que contradiziam ela.

- **O xadrez de transparência era o herói da tela.** Ele ocupava a primeira dobra inteira com um padrão cinza barulhento, e o desenho, que é o produto, competia com ele. O tom médio continua escuro de propósito — foi assim que a session 3 resolveu texto branco ilegível — mas o contraste *entre os dois quadros* caiu e a célula foi de 22 pra 16 px. Mesma luminância, muito menos ruído.
- **A escolha de forma eram 22 pílulas de texto idênticas.** Escolher forma é escolher desenho, e o desenho já estava no `Trace`. Agora cada botão mostra a própria forma, com o traço em `currentColor` — então o selecionado inverte junto, sem regra extra. A coluna é `auto-fill`: três no celular, mais na tela larga.
- **O seletor de arquivo era o do navegador.** Além de destoar de tudo, ele vem no idioma do sistema operacional: em português aparecia "Choose File", contradizendo o idioma duplo recém-entregue. `FileField` esconde o input (recortado, não `display:none`, pra preservar foco) e põe um botão de verdade na frente.
- **Copy junto:** o campo de arquivo dizia a mesma coisa três vezes (título, botão genérico, "nenhum arquivo escolhido"). Agora o botão é o rótulo e o nome do arquivo só aparece depois de escolhido, que é quando ele informa algo.
- 113 testes, bundle 82,1 → 82,4 kB gzip.

## Sessão 12 (cont.) — auditoria de acessibilidade, segurança e performance

### Acessibilidade

- **O quadro era só do mouse.** Dava pra focar cada item pelo teclado e não dava pra mover nenhum — posicionar é a interação central do app. Falha de WCAG 2.1.1 nível A. O **axe não pega**, porque o elemento é focável e tem nome. Setas movem (Shift anda 5), e o controle de tamanho virou slider de verdade: entrou no tab, ganhou `aria-valuemin/max` e responde a setas, Home e End.
  - Sem encaixe no teclado, de propósito: o passo é menor que o limiar das guias, então o ímã prenderia o item no alvo — o mesmo problema que o arrasto resolve guardando a posição livre à parte.
  - A tecla só vale com o foco no bloco. Dentro dele há texto editável, e lá as setas são do cursor.
  - Coberto por `test/keyboard.test.tsx`, que é o tipo de coisa que regride calada.
- **Contraste do botão principal**: branco sobre `#FF4D12` dá 3,3:1, abaixo dos 4,5:1. Entrou `--accent-deep` (`#D63A00`, 4,7:1) só no fundo do botão; a marca segue com o laranja original no logo e nas guias. O botão do Strava não podia mudar de cor — é marca deles — então foi pelo outro caminho: ≥18,66px em 700 conta como texto grande e a exigência cai pra 3:1.
- **Barra de exportação virou `sticky`.** Era `fixed` com espaço reservado por um `padding-bottom` fixo de 84px no body, e abaixo de 380px ela quebra em duas linhas, vai pra 111px e **come o último painel**. `sticky` reserva a própria altura, então vale pra qualquer altura — inclusive em outro idioma. Também virou `<footer>`, que resolve o único outro achado do axe (conteúdo fora de landmark).
- Alvo de toque das alças subiu de 22 pra 24px, que é o mínimo da WCAG 2.2.
- **axe-core: 0 violações** depois, contra 2 antes. Rodado com uma forma no quadro, que é o estado real de uso.

### Segurança

- **OAuth sem `state`.** Um link montado por terceiro fazia o navegador da vítima completar o fluxo com o `code` de quem montou, e a aba passava a falar com a conta Strava do atacante. Agora sorteia um valor por conexão, guarda em `sessionStorage` e confere na volta.
- **Cabeçalhos**: entrou `vercel.json` com CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e `Cross-Origin-Opener-Policy`. A CSP é a mitigação real do token do Strava morar em `localStorage`: sem XSS, não tem como lê-lo.
  - **A CSP foi testada contra o build de produção**, servido por um servidor local com os mesmos cabeçalhos, exercitando carga, escolha de forma, exportação com download (`blob:`) e foto de fundo (object URL). Zero violações. CSP errada quebra o app em produção e não dá aviso — vale repetir esse teste ao mexer nela.
  - `frame-ancestors 'none'` fecha clickjacking no botão de conectar.

### Performance — o que parecia problema e não era

- **Fontes: 1,5 MB no catálogo, 2 arquivos na prática.** São 9 famílias e 45 arquivos no `<link>`, mas `unicode-range` e carregamento sob demanda fazem o navegador buscar só Archivo e Archivo Black no primeiro carregamento. Medido interceptando `fonts.gstatic.com`. Sobra o CSS de 29 kB que bloqueia render; separar as fontes de overlay exigiria injetar `<link>` por JS (a CSP proíbe `onload` inline) e economizaria pouco. **Não vale.**
- Bundle 246 kB bruto / 83 kB gzip, num app React com 22 formas vetorizadas embutidas. Sem gordura óbvia.
- Arrasto no tema mais pesado (5 camadas, traçado de 1,5 kB de `d`) fica dentro do orçamento de um quadro. A medida é limitada pelo overhead do Playwright, então serve pra descartar lentidão patológica, não pra afirmar 60fps.
- 119 testes, bundle 82,4 → 83,0 kB gzip.

## Sessão 13 (2026-08-05) — domínio próprio e prévia de link

- **O app mora em `https://storyline.fmeira.dev/`.** O projeto na Vercel foi renomeado de `trajeto-app` pra `storyline` (`prj_O5el2XM4FuuOlc9X4VbN28kPDZOE`) e ganhou domínio próprio. **Isso revoga a decisão da session 12** de manter domínio e projeto como estavam — a razão de manter era não quebrar o OAuth, e o Flávio fez a troca junto com o Authorization Callback Domain, que é o que a decisão pedia. O `trajeto-app-fmeira.vercel.app` não respondeu mais.
- **O repo continua `trajeto-app` de propósito**, e a chave `trajeto_strava` do localStorage também: renomear desconectaria quem já autorizou.
- **Estado conferido por fora, não por memória:** produção é `dpl_Fd1gPZiu…` (main, `86d51d1`, READY), `ssoProtection.enabled = false`, e os cabeçalhos de segurança da session 12 chegam no domínio novo. `curl` e `WebFetch` seguem levando 403 no túnel; quem alcança é o `web_fetch_vercel_url`.
- **`/api/strava-config` devolve `{"clientId":"267503"}`.** A pendência que ficou aberta da session 4 à 8 tinha sido fechada pela palavra do Flávio; agora está verificada.

### Prévia de link e ícone

- O `index.html` não tinha favicon nem Open Graph. O produto inteiro é sobre compartilhar imagem, e o link dele aparecia vazio em DM e story — mais visível ainda com domínio próprio novo.
- **`scripts/gen-og.mjs` gera `public/og.png` e `public/apple-touch-icon.png`** (Chromium, como o `gen-shapes.mjs`; o playwright fica fora do `package.json` pelo mesmo motivo). Rede social não rasteriza SVG em `og:image`, então tem que sair PNG — e como o cartão repete a marca e as curvas de nível do header, gerar é o que mantém os dois iguais quando um mudar.
  - **As fontes entram embutidas como data URI.** O Chromium desta caixa não alcança `fonts.googleapis.com`, mas o `fetch` do node alcança o gstatic — mesmo contorno que a session 12 usou pra ver a Rubik Doodle Shadow. Sem embutir, o cartão sairia na fonte de sistema.
  - **O traço é amostrado e sacudido**, não uma curva limpa: curva limpa lê como onda de enfeite, e o que o app entrega é trajeto gravado. O ruído é semeado, senão o PNG mudava a cada regeração.
- **As meta tags ficam em pt-BR e não acompanham a troca de idioma**, de propósito: quem lê é o robô da rede social, que não roda o JS que reescreve o título. Confirmado no teste — o `document.title` virou inglês pelo locale da máquina enquanto o `og:title` seguiu em português.
- Só `twitter:card` foi declarado: o X lê `og:title`/`og:description`/`og:image` quando não há equivalente `twitter:`.
- **CSP retestada contra o build**, como a session 12 mandou fazer sempre que mexer no que é servido: os três assets novos carregam, zero violação. A única falha de rede é o `fonts.googleapis.com`, que é o proxy do sandbox e já estava registrado.
- 119 testes, bundle 83,0 kB gzip (inalterado — nada disso entra no bundle).

## Pendências

- [x] Revisar spec de design — resolvido 2026-07-23 (aprovação delegada, session 2)
- [x] Definir nome do produto — resolvido 2026-07-23: Traço (session 2)
- [x] Criar repo GitHub `trajeto-app` e dar push — resolvido 2026-07-23 (session 2)
- [x] Token PAT `trajeto-push` — encerrado 2026-07-30 (session 7) por decisão do Flávio: deixar expirar em vez de revogar, já que os tokens estão perto da data de expiração. Aberta desde 2026-07-23 (5 sessões).
- [x] Deploy Vercel — resolvido 2026-07-23 via MCP `deploy_to_vercel`, build ok (session 2)
- [x] Rotacionar client secret do Strava — resolvido 2026-07-30 (session 7), secret novo gerado. Invalida o vazamento da session 5.
- [x] Conectar o repo GitHub na Vercel — resolvido 2026-07-30 (session 7). Deploy por push, sem mais MCP manual.
- [x] Desligar a Deployment Protection — resolvido 2026-07-30 (session 7), `ssoProtection.enabled = false`. App público em https://trajeto-app-fmeira.vercel.app/ (200 verificado). Aberta desde 2026-07-23, 5 sessões.
- [x] Gravar STRAVA_CLIENT_ID (numérico) e STRAVA_CLIENT_SECRET (o novo) na Vercel — https://vercel.com/flavioricardo91/trajeto-app/settings/environment-variables — **e** apontar o Authorization Callback Domain para `trajeto-app-fmeira.vercel.app` — https://www.strava.com/settings/api
      | Blocks: botão Conectar com Strava. Confirmado em 2026-07-30 que `/api/strava-config` devolve `null` num deploy posterior à rotação, então não é defasagem de deploy: as duas variáveis não estão gravadas na Vercel.
      | Por que o callback mudou: o app passou a rodar em `trajeto-app-fmeira.vercel.app` e o `redirect_uri` é montado a partir do `location.origin`. Se o domínio do Strava não bater com aquele por onde o usuário entra, o OAuth é recusado.
      | Depois de gravar: as env vars só valem no deploy seguinte. Com o Git conectado, qualquer push em main já republica.
      | Como validar: abrir https://trajeto-app-fmeira.vercel.app/api/strava-config — tem que vir um número no `clientId`. `null` = ausente ou não numérico (o guard rejeita).
      | Encerrada 2026-07-30 (session 8) pelo Flávio: "está tudo certo, integração com o Strava funcionando". Fechada pela confirmação dele, não por verificação minha. Aberta desde 2026-07-24 (session 4), 4 sessões.
      | **Verificada 2026-08-05 (session 13):** `/api/strava-config` devolve `{"clientId":"267503"}` no domínio novo.
- [x] Apontar o Authorization Callback Domain do Strava pra `storyline.fmeira.dev` — https://www.strava.com/settings/api — resolvido 2026-08-05 (session 13) pelo Flávio, junto com a troca de domínio. O `redirect_uri` sai de `location.origin + location.pathname` (`StravaPanel.tsx`), então trocar o domínio sem trocar isto recusaria todo OAuth. Nasceu e morreu na mesma sessão.

**Nenhuma pendência aberta.**
