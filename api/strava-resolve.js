// Resolve link curto do Strava (strava.app.link) até o id da atividade.
// O navegador não consegue: o Branch não devolve CORS, então o fetch é bloqueado.
//
// A URL vem do usuário, então o host é conferido contra uma allowlist estrita —
// sem isso o endpoint viraria proxy pra qualquer destino.
const ALLOWED = /^https:\/\/strava\.app\.link\/[\w-]+\/?$/i

export default async function handler(req, res) {
  const url = String(req.query?.url ?? '')
  if (!ALLOWED.test(url)) return res.status(400).json({ error: 'Link curto inválido' })

  try {
    const r = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrajetoApp/1.0)' },
    })
    // O id pode estar na URL final ou embutido na página do Branch, dependendo
    // de como ele decide responder — vale tentar os dois.
    const alvo = r.url.match(/activities\/(\d+)/)
    if (alvo) return res.status(200).json({ id: alvo[1] })

    const corpo = await r.text()
    const noCorpo = corpo.match(/activities\\?\/(\d+)/)
    if (noCorpo) return res.status(200).json({ id: noCorpo[1] })

    res.status(404).json({ error: 'Esse link não leva a uma atividade' })
  } catch {
    res.status(502).json({ error: 'Não deu pra abrir o link curto' })
  }
}
