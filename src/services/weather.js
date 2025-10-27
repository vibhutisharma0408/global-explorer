import axios from 'axios'

const API = 'https://api.openweathermap.org/data/2.5/weather'
const KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

export async function getWeatherByCity(city) {
  // Try OpenWeather if key is present; otherwise fall back to Open-Meteo (no key required)
  if (KEY) {
    try {
      const params = { q: city, appid: KEY, units: 'metric' }
      const { data } = await axios.get(API, { params })
      return {
        temp: data.main?.temp,
        humidity: data.main?.humidity,
        wind: data.wind?.speed,
        description: data.weather?.[0]?.description ?? '—',
        icon: data.weather?.[0]?.icon ?? null,
      }
    } catch {}
  }

  // Fallback: Open-Meteo using free geocoding + current_weather
  try {
    const geo = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: city, count: 1 },
    })
    const loc = geo?.data?.results?.[0]
    if (!loc) return null
    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        current_weather: true,
      },
    })
    const cw = data?.current_weather
    if (!cw) return null
    return {
      temp: cw.temperature,
      humidity: null,
      wind: cw.windspeed,
      description: 'Current weather',
      icon: null,
    }
  } catch {
    return null
  }
}

export async function getWeatherByCityOrCoords(city, latlng) {
  // Prefer coords when available for better accuracy (Open-Meteo)
  if (Array.isArray(latlng) && latlng.length === 2) {
    try {
      const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: latlng[0],
          longitude: latlng[1],
          current_weather: true,
        },
      })
      const cw = data?.current_weather
      if (cw) {
        return {
          temp: cw.temperature,
          humidity: null,
          wind: cw.windspeed,
          description: 'Current weather',
          icon: null,
        }
      }
    } catch {}
  }
  return getWeatherByCity(city)
}
