import type { NextApiRequest, NextApiResponse } from 'next'

const ALLOWED_HOSTS = ['firebasestorage.googleapis.com']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing url parameter' })
    return
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(url)
  } catch (error) {
    res.status(400).json({ error: 'Invalid url parameter' })
    return
  }

  const isAllowedHost = ALLOWED_HOSTS.some(host => targetUrl.hostname === host || targetUrl.hostname.endsWith(`.${host}`))
  if (!isAllowedHost) {
    res.status(400).json({ error: 'Host not allowed' })
    return
  }

  try {
    const response = await fetch(targetUrl.toString())
    if (!response.ok) {
      res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` })
      return
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400') // cache for a day to reduce repeated fetches
    res.send(buffer)
  } catch (error) {
    console.error('Image proxy error:', error)
    res.status(500).json({ error: 'Failed to proxy image' })
  }
}
