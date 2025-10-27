import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useFavorites } from '../context/FavoritesContext'
import { getWeatherByCity } from '../services/weather'

export default function CountryCard({ country }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [miniWeather, setMiniWeather] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!import.meta.env.VITE_OPENWEATHER_API_KEY) return
      if (!country.capital) return
      try {
        const w = await getWeatherByCity(country.capital)
        if (!mounted) return
        setMiniWeather({ temp: Math.round(w.temp), icon: w.icon })
      } catch {}
    })()
    return () => (mounted = false)
  }, [country.capital])

  return (
    <div className="card">
      <button
        className={`fav-btn ${isFavorite(country) ? 'active' : ''}`}
        title="Toggle favorite"
        onClick={() => toggleFavorite(country)}
      >
        {isFavorite(country) ? '★' : '☆'}
      </button>
      <Link to={`/country/${country.name}`} className="card-link">
        <img src={country.flag} alt={`${country.name} flag`} className="flag" />
        <div className="card-body">
          <h3 className="card-title">
            {country.name}
            {miniWeather && (
              <span className="mini-weather" title="Current temp">
                {miniWeather.temp}°C
              </span>
            )}
          </h3>
          <p><strong>Capital:</strong> {country.capital || '—'}</p>
          <p><strong>Region:</strong> {country.region}</p>
          <p><strong>Population:</strong> {country.population.toLocaleString()}</p>
        </div>
      </Link>
    </div>
  )
}
