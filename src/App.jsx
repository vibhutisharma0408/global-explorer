import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import CountryDetails from './pages/CountryDetails'
import Favorites from './pages/Favorites'
import { FavoritesProvider } from './context/FavoritesContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import ThemeToggle from './components/ThemeToggle'

function Layout({ children }) {
  const { theme } = useTheme()
  return (
    <div className={`app ${theme}`}>
      <header className="container header">
        <h1>Global Explorer</h1>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
          <NavLink to="/favorites" className={({ isActive }) => (isActive ? 'active' : '')}>Favorites</NavLink>
        </nav>
        <ThemeToggle />
      </header>
      <main className="container">{children}</main>
      <footer className="container footer">Data: REST Countries, OpenWeather, NewsAPI</footer>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/country/:name" element={<CountryDetails />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </Layout>
      </FavoritesProvider>
    </ThemeProvider>
  )
}
