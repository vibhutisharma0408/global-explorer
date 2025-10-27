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
  try {
    // Try local fallback first (has population data)
    try {
      const local = await import('./src/data/countries_fallback.json', { with: { type: 'json' } })
      const data = local.default || []
      if (Array.isArray(data) && data.length) {
        console.log('[countries] Using local fallback, found', data.length, 'countries with population data')
        return res.json(data)
      }
    } catch (e) {
      console.log('[countries] Local fallback failed:', e.message)
    }

    // Try REST Countries API (should have population)
    try {
      const { data } = await axios.get('https://restcountries.com/v3.1/all')
      if (Array.isArray(data) && data.length) {
        console.log('[countries] Using REST Countries API, found', data.length, 'countries')
        return res.json(data)
      }
    } catch (e) {
      console.log('[countries] REST Countries API failed:', e.message)
    }

    // Try mirrors (mledoze/countries dataset) - may not have population
    const mirrors = [
      'https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json',
      'https://unpkg.com/mledoze-countries@latest/countries.json',
      'https://raw.githubusercontent.com/mledoze/countries/master/countries.json',
    ]
    for (const url of mirrors) {
      try {
        const { data } = await axios.get(url)
        if (Array.isArray(data) && data.length) {
          console.log('[countries] Using mirror dataset, found', data.length, 'countries')
          return res.json(data)
        }
      } catch (e) {
        console.log('[countries] Mirror failed:', url, e.message)
      }
    }

    // Try world-countries package (may not have population)
    try {
      const pkg = await import('world-countries')
      const list = (pkg.default || pkg) ?? []
      if (Array.isArray(list) && list.length) {
        console.log('[countries] Using world-countries package, found', list.length, 'countries')
        return res.json(list)
      }
    } catch (e) {
      console.log('[countries] world-countries package failed:', e.message)
    }

    console.log('[countries] All data sources failed, returning empty array')
    return res.json([])
  } catch (e) {
    console.log('[countries] Fatal error:', e.message)
    return res.json([])
  }
})

app.get('/api/news/top', async (req, res) => {
  try {
    const { country, q, pageSize = 3 } = req.query
    const lang = 'en'
    let articles = []

    // Try NewsAPI if key is available
    if (NEWS_KEY) {
      // Try top-headlines by country first
      if (country) {
        try {
          const { data } = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: { country, pageSize, language: lang, apiKey: NEWS_KEY },
          })
          if (data?.status === 'ok' && Array.isArray(data?.articles) && data.articles.length) {
            articles = data.articles.map(a => ({ title: a.title, url: a.url }))
          } else {
            console.log('[news] top-headlines returned 0, falling back to everything', { country })
          }
        } catch (e) {
          console.log('[news] top-headlines error, falling back', e?.response?.data || e.message)
        }
      }

      // Fallback: everything search with query
      if (!articles.length) {
        try {
          const query = q || country || 'world'
          const { data } = await axios.get('https://newsapi.org/v2/everything', {
            params: { q: query, sortBy: 'publishedAt', pageSize, language: lang, apiKey: NEWS_KEY },
          })
          articles = Array.isArray(data?.articles)
            ? data.articles.map(a => ({ title: a.title, url: a.url }))
            : []
        } catch (e) {
          console.log('[news] everything API error', e?.response?.data || e.message)
        }
      }
    } else {
      console.warn('[news] Missing NEWSAPI_KEY, using RSS fallback')
    }

    // Final fallback: Google News RSS scrape (works without API key)
    if (!articles.length) {
      try {
        const query = q || country || 'world'
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
        const rss = await axios.get(rssUrl)
        const xml = String(rss.data)
        const items = []
        const regex = /<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g
        let m
        while ((m = regex.exec(xml)) && items.length < pageSize) {
          items.push({ title: m[1], url: m[2] })
        }
        if (items.length) {
          articles = items
          console.log('[news] RSS fallback successful, found', items.length, 'articles')
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
