const GEO_API_URL = 'https://wft-geo-db.p.rapidapi.com/v1/geo';

const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';
const WEATHER_API_KEY = 'c0fec8e5acaaf3ef16e89090cc16ae30'; // Replace with your OpenWeatherMap API key

const GEO_API_OPTIONS = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': '4f0dcce84bmshac9e329bd55fd14p17ec6fjsnff18c2e61917',
    'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
  },
};

export async function fetchWeatherData(lat, lon) {
  try {
    const [weatherFetch, forecastFetch] = await Promise.all([
      fetch(
        `${WEATHER_API_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      ),
      fetch(
        `${WEATHER_API_URL}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      ),
    ]);

    const weatherResponse = await weatherFetch.json();
    const forecastResponse = await forecastFetch.json();
    return [weatherResponse, forecastResponse];
  } catch (error) {
    console.error(error);
  }
}

// Rate limiting for smooth performance
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 300; // 300ms between requests

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
    
    // Set up timeout
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
    console.error('Error fetching cities', error);
    throw error;
  }
}
