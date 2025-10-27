import { createContext, useContext, useEffect, useMemo } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import { getAllCountries, normalizeCountry } from '../services/api'

const FavoritesCtx = createContext(null)

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useLocalStorage('ge:favorites', [])

  const toggleFavorite = country => {
    setFavorites(prev => {
      const exists = prev.find(c => c.cca3 === country.cca3)
      if (exists) return prev.filter(c => c.cca3 !== country.cca3)
      return [...prev, country]
    })
  }

  const isFavorite = country => favorites.some(c => c.cca3 === country.cca3)

  const value = useMemo(() => ({ favorites, toggleFavorite, isFavorite }), [favorites])

  // Migration: if stored favorites have missing data (e.g., population 0), refresh from current dataset
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!favorites?.length) return
      const needsUpdate = favorites.some(c => !c.population || !c.flag || !c.region)
      if (!needsUpdate) return
      try {
        const all = await getAllCountries()
        const normalized = all.map(normalizeCountry)
        const byCca3 = new Map(normalized.map(c => [c.cca3, c]))
        const migrated = favorites.map(f => byCca3.get(f.cca3) || f)
        if (!cancelled) setFavorites(migrated)
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return <FavoritesCtx.Provider value={value}>{children}</FavoritesCtx.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesCtx)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
