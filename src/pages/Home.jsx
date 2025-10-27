import { useEffect, useMemo, useState } from 'react'
import { getAllCountries, normalizeCountry } from '../services/api'
import SearchBar from '../components/SearchBar'
import Filters from '../components/Filters'
import Pagination from '../components/Pagination'
import CountryCard from '../components/CountryCard'
import Loader from '../components/Loader'
import ErrorState from '../components/ErrorState'

const PAGE_SIZE = 24

export default function Home() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('all')
  const [sortBy, setSortBy] = useState('name') // name | population | area
  const [page, setPage] = useState(1)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await getAllCountries()
        if (!mounted) return
        const normalized = data.map(normalizeCountry)
        setCountries(normalized)
      } catch (e) {
        setError('Failed to fetch countries. Please try again later.')
      } finally {
        setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [])

  const filtered = useMemo(() => {
    let list = countries
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        c => c.name.toLowerCase().includes(q) || (c.capital || '').toLowerCase().includes(q)
      )
    }
    if (region !== 'all') {
      list = list.filter(c => c.region === region)
    }
    if (sortBy === 'population') {
      list = [...list].sort((a, b) => b.population - a.population)
    } else if (sortBy === 'area') {
      list = [...list].sort((a, b) => (b.area || 0) - (a.area || 0))
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [countries, query, region, sortBy])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const pageStart = (pageSafe - 1) * PAGE_SIZE
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => setPage(1), [query, region, sortBy])

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} />

  return (
    <div>
      <div className="controls">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by country or capital" />
        <Filters region={region} setRegion={setRegion} sortBy={sortBy} setSortBy={setSortBy} />
      </div>

      <div className="grid">
        {pageItems.map(c => (
          <CountryCard key={c.cca3} country={c} />
        ))}
      </div>

      <Pagination page={pageSafe} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
