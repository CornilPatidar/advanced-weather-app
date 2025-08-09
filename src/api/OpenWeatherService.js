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
    let [weatherPromise, forcastPromise] = await Promise.all([
      fetch(
        `${WEATHER_API_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      ),
      fetch(
        `${WEATHER_API_URL}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      ),
    ]);

    const weatherResponse = await weatherPromise.json();
    const forcastResponse = await forcastPromise.json();
    return [weatherResponse, forcastResponse];
  } catch (error) {
    console.log(error);
  }
}

export async function fetchCities(input, signal) {
  try {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (signal && !signal.aborted) {
        console.log('Request timeout after 10 seconds');
      }
    }, 10000);
    
    const response = await fetch(
      `${GEO_API_URL}/cities?minPopulation=10000&namePrefix=${input}&limit=10`,
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
    console.log('Search results for "' + input + '":', data.data?.length || 0, 'cities');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Search request was cancelled');
      throw error;
    }
    console.error('Error fetching cities for "' + input + '":', error);
    throw error;
  }
}
