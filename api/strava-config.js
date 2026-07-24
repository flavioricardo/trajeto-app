export default function handler(_req, res) {
  res.status(200).json({ clientId: process.env.STRAVA_CLIENT_ID ?? null })
}
