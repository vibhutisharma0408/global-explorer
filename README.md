# Global Explorer
DEPLOYED LINK - https://global-explorer-pxrw.vercel.app/
A modern React application for exploring countries around the world with interactive maps, country details, news, and weather information.


## Features

- 🌍 Interactive world map with country exploration
- 📊 Detailed country information and statistics
- 📰 Latest news from around the world
- 🌤️ Weather information for different countries
- ❤️ Favorites system to save preferred countries
- 🌙 Dark/Light theme toggle
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Maps**: Leaflet, React Leaflet
- **Styling**: CSS3 with modern design patterns
- **Backend**: Express.js, Node.js
- **APIs**: REST Countries API, NewsAPI, Weather APIs
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vibhutisharma0408/global-explorer.git
cd global-explorer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your API keys:
```env
VITE_NEWS_API_KEY=your_news_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Start the backend server (in a separate terminal):
```bash
npm run server
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start backend server
- `npm run lint` - Run ESLint

## Deployment

This project is configured for deployment on Vercel. The deployment includes:

- Frontend build served as static files
- Backend API routes handled by Vercel serverless functions
- Automatic builds on git push to main branch

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/countries` - Get all countries data
- `GET /api/news/top?country=US&pageSize=3` - Get top news for a country

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
