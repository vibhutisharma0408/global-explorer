import axios from 'axios'
import countriesData from 'world-countries'

const REST_BASE = 'https://restcountries.com/v3.1'
const http = axios.create({ timeout: 15000 })

export async function getAllCountries() {
  // -1) Immediate offline dataset (guaranteed full list)
  if (Array.isArray(countriesData) && countriesData.length) {
    return countriesData
  }

  // 0) Try our local proxy first to avoid CORS and ensure full dataset
  try {
    const { data } = await http.get('/api/countries')
    if (Array.isArray(data) && data.length) return data
  } catch {}

  // 0.5) Try packaged dataset (works offline, no network)
  try {
    const pkg = await import('world-countries')
    const list = (pkg.default || pkg) ?? []
    if (Array.isArray(list) && list.length) return list
  } catch {}

  // 1) REST Countries with fields (fast)
  const fields = 'name,cca2,cca3,capital,region,subregion,population,area,flags,languages,currencies,borders,latlng'
  const urlWithFields = `${REST_BASE}/all?fields=${fields}`
  try {
    const { data } = await http.get(urlWithFields)
    return data
  } catch (err1) {
    // 2) REST Countries full payload
    try {
      const { data } = await http.get(`${REST_BASE}/all`)
      return data
    } catch (err2) {
      // 3) Public mirrors
      const mirrors = [
        'https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json',
        'https://unpkg.com/mledoze-countries@latest/countries.json',
        'https://raw.githubusercontent.com/mledoze/countries/master/countries.json',
      ]
      for (const url of mirrors) {
        try {
          const { data } = await http.get(url)
          if (Array.isArray(data) && data.length) {
            return data.map(d => ({
              ...d,
              population: (() => {
                const v = d.population ?? d.pop_est ?? d.popEst ?? d.Population ?? d.pop
                const n = typeof v === 'string' ? Number(v.replace(/[^0-9.\-]/g, '')) : v
                return Number.isFinite(n) ? n : 0
              })(),
              area: (() => {
                const v = d.area ?? d.landArea ?? d.Area
                const n = typeof v === 'string' ? Number(v.replace(/[^0-9.\-]/g, '')) : v
                return Number.isFinite(n) ? n : null
              })(),
            }))
          }
        } catch {}
      }
      // 3.5) Package fallback (works in client too)
      try {
        const pkg = await import('world-countries')
        const list = (pkg.default || pkg) ?? []
        if (Array.isArray(list) && list.length) return list
      } catch {}
      // 4) Local bundled minimal dataset
      const local = await import('../data/countries_fallback.json')
      const arr = local.default || []
      return arr.map(d => ({
        ...d,
        population: (() => {
          const v = d.population ?? d.pop_est ?? d.popEst ?? d.Population ?? d.pop
          const n = typeof v === 'string' ? Number(v.replace(/[^0-9.\-]/g, '')) : v
          return Number.isFinite(n) ? n : 0
        })(),
        area: (() => {
          const v = d.area ?? d.landArea ?? d.Area
          const n = typeof v === 'string' ? Number(v.replace(/[^0-9.\-]/g, '')) : v
          return Number.isFinite(n) ? n : null
        })(),
      }))
    }
  }
}

export async function getCountryByName(name) {
  // Try exact match first; if it fails, try partial; then local fallback
  const exactUrl = `${REST_BASE}/name/${encodeURIComponent(name)}?fullText=true`
  try {
    const { data } = await http.get(exactUrl)
    return data
  } catch {
    const partialUrl = `${REST_BASE}/name/${encodeURIComponent(name)}`
    try {
      const { data } = await http.get(partialUrl)
      return data
    } catch (err2) {
      const local = await import('../data/countries_fallback.json')
      // Do a simple match on common name to simulate lookup
      const arr = (local.default || []).filter(
        item => item?.name?.common?.toLowerCase() === String(name).toLowerCase()
      )
      return arr.length ? arr : [local.default?.[0]].filter(Boolean)
    }
  }
}
function parseNum(val, fallback = 0) {
  if (val == null) return fallback
  if (typeof val === 'number') return Number.isFinite(val) ? val : fallback
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.\-]/g, '')
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

export function normalizeCountry(raw) {
  return {
    name: raw?.name?.common || '',
    officialName: raw?.name?.official || '',
    cca2: raw?.cca2 || '',
    cca3: raw?.cca3 || '',
    capital: Array.isArray(raw?.capital) ? raw.capital[0] : raw?.capital || '',
    region: raw?.region || '',
    subregion: raw?.subregion || '',
    population: parseNum(raw?.population ?? raw?.pop_est ?? raw?.popEst ?? raw?.Population ?? raw?.pop, 0),
    area: parseNum(raw?.area ?? raw?.landArea ?? raw?.Area, null),
    // Prefer REST flags, otherwise fallback to flagcdn using cca2
    flag:
      (raw?.flags && (raw.flags.svg || raw.flags.png)) ||
      (raw?.cca2 ? `https://flagcdn.com/${String(raw.cca2).toLowerCase()}.svg` : ''),
    // Support both object and array formats
    languages: Array.isArray(raw?.languages)
      ? raw.languages
      : raw?.languages
      ? Object.values(raw.languages)
      : [],
    currencies: Array.isArray(raw?.currencies)
      ? raw.currencies
      : raw?.currencies
      ? Object.values(raw.currencies).map(c => (typeof c === 'object' ? c.name : String(c)))
      : [],
    borders: raw?.borders || [],
    latlng: raw?.latlng || null,
  }
}
