// Devolve só o Client ID (público por natureza). Client ID do Strava é numérico;
// se a env tiver outro formato (ex.: secret colado por engano), não expõe.
export default function handler(_req, res) {
  const id = process.env.STRAVA_CLIENT_ID ?? ''
  res.status(200).json({ clientId: /^\d+$/.test(id) ? id : null })
}
