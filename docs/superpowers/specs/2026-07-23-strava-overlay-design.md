# Strava Overlay Studio — Design

**Data:** 2026-07-23
**Status:** Aprovado

## Objetivo

Web app gratuito, mobile-first, onde o usuário cria um overlay PNG transparente no estilo Strava (rota + estatísticas) para colar sobre fotos no Instagram (story ou feed). Sem login, sem backend — ferramenta stateless de portfólio/tráfego.

## Requisitos

### Funcionais

- **Entrada de dados:** estatísticas digitadas manualmente. Campos genéricos (label + valor), o usuário escolhe quais aparecem. Sem noção de modalidade esportiva.
- **Rota**, três fontes (tabs):
  1. **Arquivo Strava (GPX):** upload do GPX exportado da atividade. Parser no browser extrai trackpoints e normaliza a polyline. Bônus: timestamps + elevação do GPX pré-preenchem distância, tempo, ganho de elevação e pace nos StatBlocks (usuário pode ajustar).
  2. **Buscar local:** geocoding via Nominatim (debounce 800ms, User-Agent correto — rate limit 1 req/s).
  3. **Início e fim:** dois pontos geocodificados, rota via OSRM `/route`, geometria vira polyline.
- **Personalização:** cores (rota + texto), tipografia (4–6 Google Fonts pré-carregadas), quais stats aparecem, posição/layout dos elementos (drag touch).
- **Export:** PNG transparente. Presets: 1080×1920 (story) e 1080×1080 (feed). Web Share API com fallback de download.

### Não-funcionais

- Mobile-first (edição no celular, salvar na galeria).
- 100% estático: React + Vite + TypeScript, deploy Vercel. Zero backend, zero API key.
- Bundle mínimo: sem lib de canvas/editor no MVP; drag com pointer events puros (~150 linhas).

### Fora do MVP

- FIT/TCX (binário, exige lib — GPX cobre o caso Strava).
- Login/persistência.
- DeepSeek (legenda criativa): exigiria função serverless + custo por uso. Arquitetura não bloqueia; entraria como `/api/caption` isolada com rate limit por IP.

## Arquitetura

SPA estática. Estado global: **Jotai**. Chamadas externas (Nominatim, OSRM) direto do browser.

### Componentes

| Componente | Responsabilidade |
|---|---|
| `EditorCanvas` | Área de edição na proporção do preset; fundo xadrez (transparência); hospeda elementos arrastáveis (pointer events) |
| `RouteLayer` | Polyline SVG da rota (GPX ou OSRM), escalada a partir da polyline normalizada |
| `StatBlock` | Label + valor, editável inline, N instâncias |
| `StylePanel` | Bottom sheet mobile: cor da rota, cor do texto, fonte, espessura do traço |
| `RouteSource` | Tabs: Arquivo Strava (GPX) \| Buscar local \| Início e fim |
| `ExportButton` | Redesenha estado em canvas offscreen 1080px, `toBlob('image/png')`, Web Share API / download |

### Fluxo de dados

Átomos Jotai:

- `preset` — story \| feed
- `elements[]` — tipo, posição em **%**, estilo, conteúdo
- `route` — polyline normalizada 0–1 (de GPX ou OSRM)

Posições em % garantem que editor e export escalam do mesmo estado, sem conversão de pixel. **Export lê os átomos, não o DOM.**

### Parser GPX

DOMParser nativo (~30 linhas, sem lib). Extrai `<trkpt lat lon>`, `<time>`, `<ele>`. Deriva: distância (haversine acumulada), tempo total, ganho de elevação (soma de deltas positivos), pace.

## Tratamento de erros

- Nominatim/OSRM fora do ar ou sem resultado: mensagem clara + caminho alternativo (upload GPX).
- Rate limit Nominatim: debounce 800ms + User-Agent identificando o app.
- GPX inválido/sem trackpoints: erro amigável, mantém tab aberta.

## Testes

- **Vitest (unit):** normalização de polyline, escala %→px, parser GPX (distância/tempo/elevação/pace), formatação de stats.
- **RTL:** adicionar/remover StatBlock; troca de preset preserva posições relativas.
- **Manual:** export PNG (canvas em jsdom não compensa).

## Decisões registradas

| Decisão | Motivo |
|---|---|
| Proposta A (DOM editor + canvas export) vs Konva | Bundle mínimo, controle total do PNG; Konva só se interação crescer |
| Nominatim + OSRM vs Mapbox | Zero custo, zero key, viabiliza app 100% estático |
| Posições em % no estado | Editor e export compartilham o mesmo modelo sem conversões |
| Stats genéricos (label + valor) | Elimina lógica de modalidade; GPX pré-preenche quando disponível |
