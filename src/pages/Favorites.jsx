import { useFavorites } from '../context/FavoritesContext'
import CountryCard from '../components/CountryCard'

export default function Favorites() {
  const { favorites } = useFavorites()

  return (
    <div>
      <h2>Favorites</h2>
      {favorites.length === 0 ? (
        <p className="muted">No favorites yet. Add some from Home.</p>
      ) : (
        <div className="grid">
          {favorites.map(c => (
            <CountryCard key={c.cca3} country={c} />
          ))}
        </div>
      )}
    </div>
  )
}
