import React, { useState, useRef } from 'react';
import AsyncSelect from 'react-select/async';
import { fetchCities } from '../../api/OpenWeatherService';

const Search = ({ onSearchChange }) => {
  const [searchValue, setSearchValue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const loadOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      setIsLoading(true);
      console.log('Searching for cities with input:', inputValue);
      const citiesList = await fetchCities(inputValue, abortControllerRef.current.signal);
      
      console.log('Received cities data:', citiesList);
      
      if (!citiesList || !citiesList.data) {
        console.warn('No data returned from cities API for input:', inputValue);
        return [];
      }
      
      const options = citiesList.data.map((city) => ({
        value: `${city.latitude} ${city.longitude}`,
        label: `${city.name}, ${city.countryCode}`,
      }));
      
      console.log('Mapped options for "' + inputValue + '":', options.length, 'results');
      return options;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled for input:', inputValue);
        return [];
      }
      
      // Handle rate limiting gracefully
      if (error.message.includes('Rate limit exceeded')) {
        console.warn('Rate limit hit for "' + inputValue + '", returning empty results');
        return [];
      }
      
      console.error('Error fetching cities for "' + inputValue + '":', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeHandler = (enteredData) => {
    setSearchValue(enteredData);
    onSearchChange(enteredData);
  };

  return (
    <AsyncSelect
      placeholder="Search for cities (type at least 2 characters)"
      value={searchValue}
      onChange={onChangeHandler}
      loadOptions={loadOptions}
      cacheOptions={false}
      defaultOptions={false}
      isClearable
      isSearchable
      isLoading={isLoading}
      debounceTimeout={300}
      noOptionsMessage={({ inputValue }) => 
        inputValue && inputValue.length < 2 
          ? "Type at least 2 characters to search" 
          : isLoading 
            ? "Searching..." 
            : "No cities found"
      }
      loadingMessage={() => "Searching cities..."}
      styles={{
        menu: (provided) => ({
          ...provided,
          zIndex: 9999,
        }),
      }}
    />
  );
};

export default Search;
