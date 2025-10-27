import { NavLink, Outlet } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

export default function Layout() {
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
      <main className="container"><Outlet /></main>
      <footer className="container footer">Data: REST Countries, OpenWeather, NewsAPI</footer>
    </div>
  )
}
