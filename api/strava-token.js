// Serverless: única parte que precisa do client_secret.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  const { code, refresh_token } = req.body ?? {}
  if (!code && !refresh_token) return res.status(400).json({ error: 'code ou refresh_token' })
  const body = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    ...(code ? { code, grant_type: 'authorization_code' } : { refresh_token, grant_type: 'refresh_token' }),
  })
  const r = await fetch('https://www.strava.com/oauth/token', { method: 'POST', body })
  const data = await r.json()
  res.status(r.ok ? 200 : 502).json(data)
}
