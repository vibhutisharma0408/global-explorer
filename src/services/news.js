import axios from 'axios'

const API = 'https://newsapi.org/v2/top-headlines'
const KEY = import.meta.env.VITE_NEWS_API_KEY

export async function getTopHeadlines(countryCode, countryName) {
  // Prefer hitting our backend proxy if available (no CORS, hides key)
  try {
    const { data } = await axios.get('/api/news/top', {
      params: { country: String(countryCode || '').toLowerCase(), q: countryName || countryCode, pageSize: 3 },
    })
    if (Array.isArray(data?.articles)) {
      return data.articles.map(a => ({ title: a.title, url: a.url }))
    }
  } catch {}

  // Fallback: direct browser calls (requires key and may be blocked by CORS on some plans)
  if (!KEY) return []
  try {
    const params = { country: String(countryCode || '').toLowerCase(), apiKey: KEY, pageSize: 3 }
    const { data } = await axios.get(API, { params })
    if (!data?.articles) return []
    return data.articles.map(a => ({ title: a.title, url: a.url }))
  } catch (err) {
    // Some countries unsupported by top-headlines country filter. Fallback to `everything`.
    try {
      const q = countryName || countryCode
      const { data } = await axios.get('https://newsapi.org/v2/everything', {
        params: { q, sortBy: 'publishedAt', pageSize: 3, apiKey: KEY },
      })
      if (!data?.articles) return []
      return data.articles.map(a => ({ title: a.title, url: a.url }))
    } catch (err2) {
      return []
    }
  }
}
