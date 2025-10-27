import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import axios from 'axios'

// Load .env from project root regardless of current working directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootEnvPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: rootEnvPath })

const app = express()
app.use(cors())

const PORT = process.env.PORT || 3001
const NEWS_KEY = process.env.NEWSAPI_KEY || process.env.VITE_NEWS_API_KEY

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/countries', async (_req, res) => {
  const REST_BASE = 'https://restcountries.com/v3.1'
  const fields = 'name,cca2,cca3,capital,region,subregion,population,area,flags,languages,currencies,borders,latlng'
  try {
    // Try REST with fields
    try {
      const { data } = await axios.get(`${REST_BASE}/all`, { params: { fields } })
      return res.json(data)
    } catch {}
    // Try REST full
    try {
      const { data } = await axios.get(`${REST_BASE}/all`)
      return res.json(data)
    } catch {}
    // Try mirrors
    const mirrors = [
      'https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json',
      'https://unpkg.com/mledoze-countries@latest/countries.json',
      'https://raw.githubusercontent.com/mledoze/countries/master/countries.json',
    ]
    for (const url of mirrors) {
      try {
        const { data } = await axios.get(url)
        if (Array.isArray(data) && data.length) return res.json(data)
      } catch {}
    }
    // Try world-countries package (full dataset) if installed
    try {
      const pkg = await import('world-countries')
      const list = (pkg.default || pkg) ?? []
      if (Array.isArray(list) && list.length) return res.json(list)
    } catch {}
    // Local minimal fallback
    try {
      const local = await import('../src/data/countries_fallback.json', { assert: { type: 'json' } })
      return res.json(local.default || [])
    } catch {}
    return res.json([])
  } catch (e) {
    return res.json([])
  }
})

app.get('/api/news/top', async (req, res) => {
  try {
    const { country, q, pageSize = 3 } = req.query
    const lang = 'en'
    if (!NEWS_KEY) {
      console.warn('[news] Missing NEWSAPI_KEY')
      return res.status(200).json({ articles: [] })
    }
    // Try top-headlines by country first
    if (country) {
      try {
        const { data } = await axios.get('https://newsapi.org/v2/top-headlines', {
          params: { country, pageSize, language: lang, apiKey: NEWS_KEY },
        })
        if (data?.status === 'ok' && Array.isArray(data?.articles) && data.articles.length) {
          return res.json({ articles: data.articles.map(a => ({ title: a.title, url: a.url })) })
        }
        console.log('[news] top-headlines returned 0, falling back to everything', { country })
      } catch (e) {
        console.log('[news] top-headlines error, falling back', e?.response?.data || e.message)
        // fall through to everything
      }
    }
    // Fallback: everything search with query
    const query = q || country || 'world'
    const { data } = await axios.get('https://newsapi.org/v2/everything', {
      params: { q: query, sortBy: 'publishedAt', pageSize, language: lang, apiKey: NEWS_KEY },
    })
    let articles = Array.isArray(data?.articles)
      ? data.articles.map(a => ({ title: a.title, url: a.url }))
      : []

    // Final fallback: Google News RSS scrape (no key)
    if (!articles.length) {
      try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
        const rss = await axios.get(rssUrl)
        const xml = String(rss.data)
        const items = []
        const regex = /<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g
        let m
        while ((m = regex.exec(xml)) && items.length < 3) {
          items.push({ title: m[1], url: m[2] })
        }
        if (items.length) {
          articles = items
        }
      } catch (rssErr) {
        console.log('[news] RSS fallback failed', rssErr.message)
      }
    }

    res.json({ articles })
  } catch (err) {
    console.log('[news] fatal error', err?.response?.data || err.message)
    res.status(200).json({ articles: [] })
  }
})

app.listen(PORT, () => {
  console.log(`News proxy running on http://localhost:${PORT}`)
})
