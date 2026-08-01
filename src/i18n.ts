import { atom, useAtomValue } from 'jotai'

/**
 * Dois idiomas, um dicionário.
 *
 * Cada entrada é uma tupla `[pt, en]`. Ver as duas lado a lado é o que permite
 * revisar tradução sem pular de arquivo, e o `satisfies` no fim garante que
 * nenhuma entrada fica só com uma das duas.
 *
 * Fora daqui não deve sobrar texto de interface: componente pede `t('chave')`,
 * e as funções de biblioteca lançam a chave como mensagem de erro, que o
 * componente traduz na hora de mostrar.
 */

export type Lang = 'pt' | 'en'

const STRINGS = {
  // Marca e documento
  'doc.title': ['Storyline — overlay de atividade pro seu story', 'Storyline — activity overlay for your story'],
  'doc.description': [
    'Importe a atividade do Strava ou solte um GPX, escolha um tema e baixe a imagem pronta pro Instagram.',
    'Import your Strava activity or drop a GPX, pick a theme and download the image ready for Instagram.',
  ],
  'tagline': ['Sua atividade vira imagem pro story. Grátis e sem cadastro.', 'Your activity becomes a story image. Free, no signup.'],
  'lang.aria': ['Idioma', 'Language'],

  // Painel de estatísticas
  'panel.stats': ['Estatísticas', 'Stats'],
  'stats.hint': ['Toque no texto pra editar. Arraste no quadro pra posicionar.', 'Tap the text to edit it. Drag it on the canvas to place it.'],
  'stats.add': ['Adicionar dado', 'Add stat'],
  'stats.clear': ['Limpar tudo', 'Clear all'],
  'stats.newLabel': ['Título', 'Label'],
  'stats.newValue': ['valor', 'value'],

  // Painel de foto
  'panel.photo': ['Foto de fundo', 'Background photo'],
  'photo.remove': ['Remover foto', 'Remove photo'],
  'photo.include': ['Salvar a imagem com a foto', 'Save the image with the photo'],
  'photo.hintWith': ['Sai um JPEG com a foto e o overlay juntos, pronto pra postar.', 'You get a JPEG with the photo and the overlay together, ready to post.'],
  'photo.hintWithout': [
    'Sai o PNG transparente de sempre. A foto fica só na prévia, pra você conferir o contraste.',
    'You get the usual transparent PNG. The photo stays in the preview only, so you can check the contrast.',
  ],
  'photo.choose': ['Escolha uma foto', 'Choose a photo'],
  'photo.privacy': [
    'A foto entra atrás do overlay pra você ver como fica. Ela não sai do seu aparelho e some quando você fecha a aba: nada é enviado nem guardado.',
    'The photo goes behind the overlay so you can see how it looks. It never leaves your device and disappears when you close the tab: nothing is uploaded or stored.',
  ],

  // Painel de tema
  'panel.theme': ['Tema', 'Theme'],
  'theme.plain.label': ['Nenhum', 'None'],
  'theme.plain.hint': ['O traço limpo, do jeito que sempre foi.', 'The plain line, the way it has always been.'],
  'theme.3d.label': ['3D', '3D'],
  'theme.3d.hint': ['Traço com volume, extrudado na diagonal.', 'A line with depth, extruded on the diagonal.'],
  'theme.medieval.label': ['Medieval', 'Medieval'],
  'theme.medieval.hint': ['Tinta e ouro sobre pergaminho, com serifa.', 'Ink and gold on parchment, with a serif face.'],
  'theme.tech.label': ['Futurista', 'Futuristic'],
  'theme.tech.hint': ['Néon sobre grade, com monoespaçada.', 'Neon on a grid, with a monospace face.'],
  'theme.fofo.label': ['Fofo', 'Cute'],
  'theme.fofo.hint': ['Rosa pastel com brilho, contorno branco e letra arredondada.', 'Pastel pink with a glow, white outline and a rounded face.'],
  'theme.carimbo.label': ['Carimbo', 'Stamp'],
  'theme.carimbo.hint': ['Contorno vazado com sombra riscada a caneta, no desenho da própria fonte.', 'A hollow outline with pen-hatched shadow, drawn like the theme font itself.'],

  // Painel de estilo
  'panel.style': ['Estilo', 'Style'],
  'style.routeColor': ['Cor da rota', 'Route color'],
  'style.textColor': ['Cor do texto', 'Text color'],
  'style.stroke': ['Traço', 'Stroke'],
  'style.font': ['Fonte', 'Font'],

  // Barra de exportação
  'export.format': ['Formato', 'Format'],
  'export.busy': ['Gerando…', 'Generating…'],
  'export.save': ['Salvar', 'Save'],

  // Painel de rota
  'panel.route': ['Rota', 'Route'],
  'tab.gpx': ['GPX', 'GPX'],
  'tab.place': ['Local', 'Place'],
  'tab.ab': ['A → B', 'A → B'],
  'tab.shapes': ['Formas', 'Shapes'],
  'gpx.label': ['Escolha o GPX da atividade', 'Choose the activity GPX'],
  'gpx.hint': [
    'No Strava: atividade, menu, Exportar GPX. No Wikiloc: botão Download, Arquivo GPX. Distância, tempo, elevação e pace entram sozinhos.',
    'On Strava: open the activity, menu, Export GPX. On Wikiloc: Download button, GPX file. Distance, time, elevation and pace fill themselves in.',
  ],
  'gpx.fallback': ['Tente a aba A → B.', 'Try the A → B tab.'],
  'place.label': ['Trilha, praça, pista, parque…', 'Trail, square, track, park…'],
  'place.placeholder': ['Ex.: Lapa do Índio, Cordisburgo', 'e.g. Prospect Park, Brooklyn'],
  'place.hint': [
    'Busca no OpenStreetMap. Trilhas, praças e pistas mapeadas viram traçado na hora.',
    'Searches OpenStreetMap. Mapped trails, squares and tracks become a line right away.',
  ],
  'place.fallback': ['Baixe o GPX da trilha no Wikiloc ou no Strava e use a aba GPX.', 'Download the trail GPX from Wikiloc or Strava and use the GPX tab.'],
  'shapes.activities': ['Modalidades', 'Sports'],
  'shapes.fun': ['Formas', 'Shapes'],
  'shapes.hint': ['A forma usa a mesma cor e espessura da rota.', 'The shape uses the same color and stroke as the route.'],
  'ab.start': ['Início', 'Start'],
  'ab.end': ['Fim', 'End'],
  'ab.go': ['Traçar rota', 'Draw route'],
  'ab.busy': ['Traçando…', 'Drawing…'],
  'ab.fallback': ['Se o serviço estiver fora do ar, use um arquivo GPX.', 'If the service is down, use a GPX file.'],

  // Painel do Strava
  'strava.hint': [
    'Conecte pra importar suas atividades, rotas salvas e segmentos da comunidade.',
    'Connect to import your activities, saved routes and community segments.',
  ],
  'strava.connect': ['Conectar com Strava', 'Connect with Strava'],
  'strava.disconnect': ['Desconectar', 'Disconnect'],
  'strava.linkLabel': ['Link da atividade', 'Activity link'],
  'strava.import': ['Importar atividade', 'Import activity'],
  'strava.importing': ['Importando…', 'Importing…'],
  'strava.myRoutes': ['Minhas rotas', 'My routes'],
  'strava.searching': ['Buscando…', 'Searching…'],
  'strava.segLabel': ['Segmentos perto de um local', 'Segments near a place'],
  'strava.segPlaceholder': ['Ex.: Gruta do Janelão', 'e.g. Golden Gate Park'],
  'strava.search': ['Buscar', 'Search'],
  'strava.segments': ['Segmentos da região', 'Segments nearby'],

  // Mesclagem de importação
  'merge.all': ['Substituir tudo', 'Replace everything'],
  'merge.shape': ['Só o traçado', 'Route only'],
  'merge.stats': ['Só os números', 'Stats only'],
  'merge.cancel': ['Cancelar', 'Cancel'],
  'merge.hintShape': [
    'Essa atividade não tem traçado, então entra a forma da modalidade no lugar.',
    'This activity has no route, so the sport shape takes its place.',
  ],
  'merge.hintNoShape': [
    'Essa atividade não tem traçado. Use "Só os números" e escolha a forma na aba Rota.',
    'This activity has no route. Use "Stats only" and pick a shape in the Route tab.',
  ],
  'merge.hintBoth': [
    'Pra juntar os dois: importe a atividade e depois a rota com "Só o traçado". O desenho fica o da rota planejada e os números seguem os da sua atividade.',
    'To combine both: import the activity, then the route with "Route only". The drawing comes from the planned route and the numbers stay from your activity.',
  ],

  // Quadro
  'canvas.empty': [
    'Escolha o que vai no quadro nas abas abaixo. Depois arraste cada item pra posicionar.',
    'Pick what goes on the canvas in the tabs below. Then drag each item to place it.',
  ],
  'canvas.routeAria': ['Rota. Arraste pra mover', 'Route. Drag to move'],
  'canvas.resizeAria': ['Redimensionar rota', 'Resize route'],
  'canvas.remove': ['Remover', 'Remove'],

  // Rótulos de estatística. Também vão pra imagem exportada.
  'stat.distance': ['Distância', 'Distance'],
  'stat.time': ['Tempo', 'Time'],
  'stat.timeEstimated': ['Tempo previsto', 'Estimated time'],
  'stat.pace': ['Pace', 'Pace'],
  'stat.paceEstimated': ['Pace previsto', 'Estimated pace'],
  'stat.speed': ['Velocidade', 'Speed'],
  'stat.speedEstimated': ['Velocidade prevista', 'Estimated speed'],
  'stat.elevation': ['Elevação', 'Elevation'],
  'stat.hrAvg': ['FC média', 'Avg HR'],
  'stat.hrMax': ['FC máxima', 'Max HR'],
  'stat.calories': ['Calorias', 'Calories'],
  'stat.effort': ['Esforço', 'Effort'],
  'stat.power': ['Potência', 'Power'],
  'stat.cadence': ['Cadência', 'Cadence'],
  'stat.vsPlanned': ['vs. previsto', 'vs. planned'],
  'stat.onTarget': ['no previsto', 'on target'],

  // Nomes das formas. A chave é o nome gerado em shapes-icons, que também é o
  // destino do SPORT_SHAPE — por isso ela continua em português.
  'shape.Corrida': ['Corrida', 'Running'],
  'shape.Pedal': ['Pedal', 'Cycling'],
  'shape.Natação': ['Natação', 'Swimming'],
  'shape.Caminhada': ['Caminhada', 'Walking'],
  'shape.Trilha': ['Trilha', 'Hiking'],
  'shape.Musculação': ['Musculação', 'Gym'],
  'shape.Yoga': ['Yoga', 'Yoga'],
  'shape.Skate': ['Skate', 'Skateboard'],
  'shape.Remo': ['Remo', 'Rowing'],
  'shape.Esqui': ['Esqui', 'Skiing'],
  'shape.Futebol': ['Futebol', 'Football'],
  'shape.Vela': ['Vela', 'Sailing'],
  'shape.Luta': ['Luta', 'Martial arts'],
  'shape.Boxe': ['Boxe', 'Boxing'],
  'shape.Esgrima': ['Esgrima', 'Fencing'],
  'shape.Coração': ['Coração', 'Heart'],
  'shape.Estrela': ['Estrela', 'Star'],
  'shape.Círculo': ['Círculo', 'Circle'],
  'shape.Raio': ['Raio', 'Bolt'],
  'shape.Joinha': ['Joinha', 'Thumbs up'],
  'shape.Não curti': ['Não curti', 'Thumbs down'],
  'shape.Tênis': ['Tênis', 'Sneaker'],

  // Erros. As bibliotecas lançam a chave; quem mostra é que traduz.
  'err.gpx': ['Arquivo GPX inválido', 'Invalid GPX file'],
  'err.gpxNoPoints': ['GPX sem trackpoints', 'GPX has no trackpoints'],
  'err.placeNoShape': ['Esse lugar ainda não tem traçado no OpenStreetMap', 'This place has no outline in OpenStreetMap yet'],
  'err.routeFailed': ['Não deu pra traçar a rota', 'Could not draw the route'],
  'err.search': ['Busca de local falhou', 'Place search failed'],
  'err.routing': ['Cálculo de rota falhou', 'Route calculation failed'],
  'err.noRoute': ['Nenhuma rota encontrada entre os pontos', 'No route found between those points'],
  'err.render': ['Falha ao gerar a imagem', 'Could not generate the image'],
  'err.photoRead': ['Não deu pra ler a foto', 'Could not read the photo'],
  'err.stravaAuth': ['Falha na autenticação com o Strava', 'Strava authentication failed'],
  'err.stravaExpired': ['Sessão do Strava expirou. Conecte de novo', 'Your Strava session expired. Connect again'],
  'err.stravaNotFound': ['Não encontrado. A atividade é sua e está visível?', 'Not found. Is the activity yours and visible?'],
  'err.strava': ['O Strava respondeu com erro', 'Strava responded with an error'],
  'err.stravaShortLink': ['Não deu pra abrir esse link curto', 'Could not open that short link'],
  'err.stravaConfig': ['Integração com o Strava ainda não configurada neste servidor', 'Strava integration is not set up on this server yet'],
  'err.connectFailed': ['Falha ao iniciar conexão', 'Could not start the connection'],
  'err.connectFirst': ['Conecte com o Strava primeiro', 'Connect with Strava first'],
  'err.badLink': ['Cole o link da atividade ou o link curto de compartilhar', 'Paste the activity link or the short share link'],
  'err.noAthlete': ['Conta sem identificador. Conecte de novo', 'Account has no id. Connect again'],
  'err.noRoutes': ['Nenhuma rota salva na sua conta', 'No saved routes in your account'],
  'err.placeNotFound': ['Local não encontrado', 'Place not found'],
  'err.noSegments': ['Nenhum segmento de corrida nessa região', 'No running segments in that area'],
  'err.generic': ['Deu erro', 'Something went wrong'],
} satisfies Record<string, [string, string]>

export type Key = keyof typeof STRINGS
export type T = (k: Key) => string

export const hasKey = (s: string): s is Key => s in STRINGS

/** Tradutor solto, pra quem não é componente. */
export const dict = (lang: Lang): T => k => STRINGS[k][lang === 'pt' ? 0 : 1]

/**
 * Erro pronto pra mostrar. As bibliotecas lançam a chave como mensagem; o que
 * vem de fora (rede, navegador) passa direto, porque traduzir não é possível.
 */
export const errorText = (e: unknown, t: T, fallback: Key = 'err.generic'): string => {
  const msg = e instanceof Error ? e.message : ''
  if (!msg) return t(fallback)
  return hasKey(msg) ? t(msg) : msg
}

const STORAGE_KEY = 'storyline_lang'

/** Preferência salva, senão a do navegador. */
export const detectLang = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'pt' || saved === 'en') return saved
  } catch { /* modo privado sem storage: cai na detecção */ }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

export const htmlLang = (lang: Lang) => (lang === 'pt' ? 'pt-BR' : 'en')

const base = atom<Lang>(detectLang())

/** Idioma atual. Escrever nele persiste a escolha e acerta o documento. */
export const langAtom = atom(
  get => get(base),
  (_get, set, next: Lang) => {
    set(base, next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* sem storage: vale só nesta aba */ }
    document.documentElement.lang = htmlLang(next)
    document.title = dict(next)('doc.title')
  },
)

export const useLang = () => useAtomValue(langAtom)
export const useT = (): T => dict(useAtomValue(langAtom))

/**
 * Troca o separador decimal de um valor já formatado.
 *
 * Os valores que o app produz guardam só o texto, não o número, então trocar de
 * idioma não tem como reformatar pela origem. Os formatos daqui têm no máximo
 * um separador decimal, e é só ele que muda entre pt e en — o resto do texto
 * ("km", "1h 13m", "5'30\"/km") é igual nos dois.
 */
export function localizeNumbers(value: string, lang: Lang): string {
  const [de, para] = lang === 'pt' ? ['.', ','] : [',', '.']
  return value.replace(new RegExp(`(\\d)\\${de}(\\d)`, 'g'), `$1${para}$2`)
}
