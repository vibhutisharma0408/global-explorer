import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAllCountries, getCountryByName, normalizeCountry } from '../services/api'
import { getWeatherByCityOrCoords } from '../services/weather'
import { getTopHeadlines } from '../services/news'
import Loader from '../components/Loader'
import ErrorState from '../components/ErrorState'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function CountryDetails() {
  const { name } = useParams()
  const [country, setCountry] = useState(null)
  const [bordersMap, setBordersMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weather, setWeather] = useState(null)
  const [news, setNews] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const data = await getCountryByName(name)
        if (!mounted) return
        const norm = normalizeCountry(data[0])
        setCountry(norm)
        // Prepare borders map
        const all = await getAllCountries()
        const map = {}
        all.forEach(c => {
          map[c.cca3] = c.name.common
        })
        setBordersMap(map)
        // Weather
        if (norm.capital || norm.latlng) {
          const w = await getWeatherByCityOrCoords(norm.capital, norm.latlng)
          setWeather(w)
        }
        // News
        if (norm.cca2) {
          const headlines = await getTopHeadlines(norm.cca2, norm.name)
          setNews(headlines)
        }
      } catch (e) {
        setError('Failed to fetch country details. Please try again later.')
      } finally {
        setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [name])

  const position = useMemo(() => {
    if (!country?.latlng) return null
    return [country.latlng[0], country.latlng[1]]
  }, [country])

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} />
  if (!country) return null

  return (
    <div className="details">
      <div className="details-header">
        <img src={country.flag} alt={`${country.name} flag`} className="flag-large" />
        <div>
          <h2>{country.officialName}</h2>
          <p><strong>Capital:</strong> {country.capital || '—'}</p>
          <p><strong>Region:</strong> {country.region}</p>
          <p><strong>Population:</strong> {country.population.toLocaleString()}</p>
          <p><strong>Area:</strong> {country.area ? `${country.area.toLocaleString()} km²` : '—'}</p>
          <p><strong>Languages:</strong> {country.languages?.join(', ') || '—'}</p>
          <p><strong>Currencies:</strong> {country.currencies?.join(', ') || '—'}</p>
          {country.borders?.length ? (
            <p><strong>Borders:</strong> {country.borders.map(code => (
              <Link key={code} to={`/country/${bordersMap[code] || code}`} className="border-link">{bordersMap[code] || code}</Link>
            ))}</p>
          ) : null}
        </div>
      </div>

      {position ? (
        <div className="map">
          <MapContainer center={position} zoom={5} scrollWheelZoom={false} style={{ height: 360 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={markerIcon}>
              <Popup>{country.name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      ) : null}

      <section className="extras">
        <div className="panel">
          <h3>Current Weather{country.capital ? ` in ${country.capital}` : ''}</h3>
          {weather ? (
            <div>
              <p><strong>{Math.round(weather.temp)}°C</strong> · {weather.description}</p>
              <p>Humidity: {weather.humidity ?? '—'}% · Wind: {weather.wind} m/s</p>
            </div>
          ) : (
            <p className="muted">No weather data.</p>
          )}
        </div>

        <div className="panel">
          <h3>Top News</h3>
          {news?.length ? (
            <ul className="news">
              {news.slice(0, 3).map((n, i) => (
                <li key={i}><a href={n.url} target="_blank" rel="noreferrer">{n.title}</a></li>
              ))}
            </ul>
          ) : (
            <p className="muted">No news available.</p>
          )}
        </div>
      </section>
    </div>
  )
}
