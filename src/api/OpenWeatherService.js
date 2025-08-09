// Base URL for the GeoDB Cities API (used to search for city names)
const GEO_API_URL = 'https://wft-geo-db.p.rapidapi.com/v1/geo';

// Base URL and API key for OpenWeather. Consider moving the key to environment variables.
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';
const WEATHER_API_KEY = 'c0fec8e5acaaf3ef16e89090cc16ae30'; // Replace with your OpenWeatherMap API key

// Default options for calling GeoDB (RapidAPI) endpoints.
const GEO_API_OPTIONS = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': '4f0dcce84bmshac9e329bd55fd14p17ec6fjsnff18c2e61917',
    'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
  },
};

/**
 * Fetch current weather and 5-day forecast for a given location.
 * Returns a tuple: [currentWeatherJson, forecastJson].
 * Throws an error if the HTTP response is not OK.
 */
export async function fetchWeatherData(latitude, longitude) {
  try {
    const urls = [
      `${WEATHER_API_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`,
      `${WEATHER_API_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`,
    ];

    const [weatherResponse, forecastResponse] = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Weather API request failed with status ${response.status}`);
        }
        return response.json();
      })
    );

    return [weatherResponse, forecastResponse];
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

// Simple in-memory rate limiting to avoid making requests too rapidly.
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 300; // Minimum 300ms between city search requests

/**
 * Fetch a list of city suggestions matching the given input string.
 * - Enforces a brief delay between requests (rate limiting)
 * - Abides by an AbortSignal so callers can cancel in-flight requests
 * - Throws on HTTP errors (including 429 rate limit from the API)
 */
export async function fetchCities(input, signal) {
  try {
    // Implement rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    lastRequestTime = Date.now();
    
    // Set up a simple timeout notifier (does not abort the request)
    const timeoutId = setTimeout(() => {
      if (signal && !signal.aborted) {
        console.log('Request timeout after 5 seconds');
      }
    }, 5000);
    
    const query = typeof input === 'string' ? input.trim() : '';
    const response = await fetch(
      `${GEO_API_URL}/cities?minPopulation=10000&namePrefix=${encodeURIComponent(query)}&limit=10`,
      {
        ...GEO_API_OPTIONS,
        signal: signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Rate limit exceeded, please wait before searching again');
        throw new Error('Rate limit exceeded. Please wait a moment before searching again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('Error fetching cities:', error);
    throw error;
  }
}
