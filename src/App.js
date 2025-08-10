/**
 * App.js – Main page of the weather app
 *
 * High-level idea:
 * - The user searches for a city
 * - We download current weather + forecast for that city
 * - We show today's details on the left and a weekly forecast on the right
 * - The background image changes based on the weather description
 */

import React, { useState } from 'react';
// UI components from Material UI (layout, text, icons, etc.)
import { Box, Container, Grid, Link, SvgIcon, Typography } from '@mui/material';
// Our own components
import Search from './components/Search/Search';
import WeeklyForecast from './components/WeeklyForecast/WeeklyForecast';
import TodayWeather from './components/TodayWeather/TodayWeather';
// API + helpers
import { fetchWeatherData } from './api/OpenWeatherService';
import { transformDateFormat } from './utilities/DatetimeUtils';
import LoadingBox from './components/Reusable/LoadingBox';
import { ReactComponent as SplashIcon } from './assets/splash-icon.svg';
import appLogo from './assets/logo.png';
// Weather background images
import sunImage from './assets/weather/sun.jpg';
import fogImage from './assets/weather/foggy.jpg';
import stormImage from './assets/weather/storm.jpg';
import snowImage from './assets/weather/snow.jpg';
import rainyImage from './assets/weather/rainy.jpg';
import cloudsImage from './assets/weather/clouds.jpg';
import overcastImage from './assets/weather/overcast.jpg';
import ErrorBox from './components/Reusable/ErrorBox';
import { ALL_DESCRIPTIONS } from './utilities/DateConstants';
import GitHubIcon from '@mui/icons-material/GitHub';
import {
  getTodayForecastWeather,
  getWeekForecastWeather,
} from './utilities/DataUtils';

function App() {
  // What we store:
  // - todayWeather: current conditions (temperature, wind, etc.) for the selected city
  // - todayForecast: next hours forecast (used by the "Today" panel)
  // - weekForecast: next days forecast (used by the weekly panel)
  // - isLoading: true while we are fetching data
  // - error: true if something went wrong while fetching
  const [todayWeather, setTodayWeather] = useState(null);
  const [todayForecast, setTodayForecast] = useState([]);
  const [weekForecast, setWeekForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  // Runs whenever the user selects/clears a city in the Search component
  // enteredData example: { label: 'London, GB', value: '51.5072 -0.1276' }
  const searchChangeHandler = async (enteredData) => {
    console.log('App searchChangeHandler received:', enteredData);
    
    // If the search is cleared, wipe the screen and stop here
    if (!enteredData?.value) {
      console.log('Clearing weather data...');
      // Reset all weather data when search is cleared
      setTodayWeather(null);
      setTodayForecast([]);
      setWeekForecast(null);
      setError(false);
      return;
    }

    // Coordinates come as a single string like "lat lon" -> split into two numbers
    const [latitude, longitude] = enteredData.value.split(' ');

    setIsLoading(true);

    // Prepare time helpers used by our forecast filters
    const currentDate = transformDateFormat();
    const date = new Date();
    let dt_now = Math.floor(date.getTime() / 1000);

    try {
      // Ask the API for current weather AND the 5-day/3-hour forecast
      const [todayWeatherResponse, weekForecastResponse] =
        await fetchWeatherData(latitude, longitude);

      // Build the list for today's timeline (next hours)
      const all_today_forecasts_list = getTodayForecastWeather(
        weekForecastResponse,
        currentDate,
        dt_now
      );

      // Build the list for the next several days (weekly view)
      const all_week_forecasts_list = getWeekForecastWeather(
        weekForecastResponse,
        ALL_DESCRIPTIONS
      );

      // Save results to state so the UI can render
      setTodayForecast([...all_today_forecasts_list]);
      setTodayWeather({ city: enteredData.label, ...todayWeatherResponse });
      setWeekForecast({
        city: enteredData.label,
        list: all_week_forecasts_list,
      });
    } catch (err) {
      // If anything fails (network, API, etc.) show a friendly error box and log details for developers
      setError(true);
      console.error('Failed to fetch weather data:', err);
    }

    setIsLoading(false);
  };

  // What to show by default (before search): a friendly welcome + app icon
// default (welcome screen)
let appContent = (
  <Grid item xs={12}>
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    sx={{ width: '100%', minHeight: 500 }}
  >
      <SvgIcon
      component={SplashIcon}
      inheritViewBox
        sx={{ fontSize: { xs: '110px', sm: '120px', md: '140px' } }}
    />
    <Typography
      variant="h4"
      component="h4"
      sx={{
          fontSize: { xs: '14px', sm: '14px' },
        color: 'rgba(255,255,255, .85)',
        fontFamily: 'Poppins',
        textAlign: 'center',
        margin: '2rem 0',
        maxWidth: '80%',
        lineHeight: '22px',
      }}
    >
      Discover comprehensive weather insights and forecasts for cities across the globe!
    </Typography>
  </Box>
</Grid>
);

// with data
if (todayWeather && todayForecast && weekForecast) {
  appContent = (
    <>
      <Grid item xs={12} md={6}>
        <TodayWeather data={todayWeather} forecastList={todayForecast} />
      </Grid>
      <Grid item xs={12} md={6}>
        <WeeklyForecast data={weekForecast} />
      </Grid>
    </>
  );
}

// error
if (error) {
  appContent = (
    <Grid item xs={12}>
      <ErrorBox margin="3rem auto" flex="inherit" errorMessage="Something went wrong" />
    </Grid>
  );
}

// loading
if (isLoading) {
  appContent = (
    <Grid item xs={12}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: 500,
        }}
      >
        <LoadingBox value="1">
          <Typography>...Loading...</Typography>
        </LoadingBox>
      </Box>
    </Grid>
  );
}


  // If an error happened, show an error box
  if (error) {
    appContent = (
      <Grid item xs={12}>
      <ErrorBox
        margin="3rem auto"
        flex="inherit"
        errorMessage="Something went wrong"
      />
      </Grid>
    );
  }

  // While data is loading, show a loading spinner/text
  if (isLoading) {
    appContent = (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: '500px',
        }}
      >
        <LoadingBox value="1">
              <Typography
            variant="h3"
            component="h3"
            sx={{
                  fontSize: { xs: '12px', sm: '12px' },
              color: 'rgba(255, 255, 255, .8)',
              lineHeight: 1,
              fontFamily: 'Poppins',
            }}
          >
            Loading...
          </Typography>
        </LoadingBox>
      </Box>
    );
  }

  // Turn a text description (e.g., "light rain") into a background image choice
  const getBackgroundImageForDescription = (description) => {
    if (!description) return null;
    const normalized = String(description).toLowerCase();
    if (normalized.includes('clear sky')) return sunImage; // available asset
    if (normalized.includes('snow')) return snowImage;
    if (normalized.includes('cloud')) return cloudsImage;
    if (normalized.includes('thunder') || normalized.includes('storm')) return stormImage;
    if (normalized.includes('fog') || normalized.includes('mist') || normalized.includes('haze')) return fogImage;
    if (normalized.includes('overcast')) return overcastImage;
    if (normalized.includes('rain')) return rainyImage;
  

    return null;
  };

  // Figure out which background image to use based on today's weather
  const currentDescription = todayWeather?.weather?.[0]?.description;
  const resolvedBgImage = getBackgroundImageForDescription(currentDescription);

  return (
    <Container
      sx={{
        // maxWidth: { xs: '95%', sm: '80%', md: '1100px' },
        maxWidth: { xs: '95%', md: '1100px' },
        width: '100%',
        height: '100%',
        // margin: '0 auto',
        margin: '2rem auto',
        marginTop: { xs: '2rem', sm: '3rem', md: '4rem' },
        // Keep default Container horizontal gutters; only control vertical padding
        pt: '1rem',
        pb: '3rem',
        marginBottom: '1rem',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow:'rgba(0,0,0, 0.5) 0px 10px 15px -3px, rgba(0,0,0, 0.5) 0px 4px 6px -2px',
        // Layer a semi-transparent gradient on top of the photo to keep text readable
        backgroundImage: resolvedBgImage
          ? `linear-gradient(rgba(126, 89, 226, 0.71), rgba(76, 40, 117, 0.7)), url(${resolvedBgImage})`
          : `linear-gradient(rgba(126, 89, 226, 0.71), rgba(76, 40, 117, 0.7))`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Grid container columnSpacing={2}>
        <Grid item xs={12}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              width: '100%',
              marginBottom: '1rem',
            }}
          >
            {/* App logo on the left */}
            <Box
              component="img"
              src={appLogo}
              alt="Weatherwise Pro logo"
              sx={{
                display: 'block',
                height: { xs: 48, sm: 55, md: 66 },
                width: 'auto',
              }}
            />

            
            <Link
              href="https://github.com/cornil-devil/advanced-weather-app"
              target="_blank"
              underline="none"
              sx={{ display: 'flex' }}
            >
              <GitHubIcon
                sx={{
                  fontSize: { xs: '22px', sm: '22px', md: '26px' },
                  color: 'white',
                  '&:hover': { color: '#f093fb' },
                }}
              />
            </Link>
          </Box>
          {/* City search input. When you pick a city, it calls searchChangeHandler */}
          <Search onSearchChange={searchChangeHandler} />
        </Grid>
        {/* Main content area (welcome, loading, error, or weather panels) */}
        {appContent}
      </Grid>
    </Container>
  );
}

export default App;
