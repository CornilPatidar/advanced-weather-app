# Advanced Weather App

React weather application with intelligent search and real-time forecasting.

## Key Features

- **Smart Search**: Autocomplete with 200k+ cities, 300ms debounce, rate limit protection
- **Real-time Data**: Current weather + 5-day forecast with Promise.all optimization  
- **Responsive Design**: Mobile-first approach with clean UI

## Tech Stack

```
React 18 | OpenWeatherMap API | GeoDB Cities API | React Select
```

## Quick Start

```bash
git clone https://github.com/cornil-devil/advanced-weather-app.git
cd advanced-weather-app
npm install
npm start
```

**API Keys Required**: Add your keys to `src/api/OpenWeatherService.js`
- [OpenWeatherMap](https://openweathermap.org/api) 
- [RapidAPI GeoDB](https://rapidapi.com/wirefreethought/api/geodb-cities)

## Architecture

```
src/
├── api/OpenWeatherService.js     # API layer with error handling
├── components/
│   ├── Search/                   # Debounced autocomplete search  
│   ├── TodayWeather/            # Current conditions + hourly
│   └── WeeklyForecast/          # 5-day outlook
└── utilities/                    # Data processing & formatting
```

## Performance Optimizations

- **Search**: 300ms debounce, request cancellation, rate limiting
- **API**: Parallel requests, error boundaries, caching
- **UI**: Conditional rendering, optimized re-renders

## Search Implementation

```javascript
// Rate-limited search with abort signal
const loadOptions = async (inputValue) => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  const citiesList = await fetchCities(inputValue, signal);
  return citiesList.data.map(city => ({
    value: `${city.latitude} ${city.longitude}`,
    label: `${city.name}, ${city.countryCode}`
  }));
};
```

## API Integration

**Parallel Weather Data Fetching**:
```javascript
const [weatherResponse, forecastResponse] = await Promise.all([
  fetch(`/weather?lat=${lat}&lon=${lon}`),
  fetch(`/forecast?lat=${lat}&lon=${lon}`)
]);
```

**Rate Limiting Protection**:
```javascript
const MIN_REQUEST_INTERVAL = 500;
if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
  await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
}
```

## Scripts

```bash
npm start     # Development server
npm run build # Production build  
npm test      # Test suite
```

---
Built with focus on performance, UX, and clean architecture.