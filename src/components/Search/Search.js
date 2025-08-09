import React, { useState, useRef, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { components } from 'react-select';
import { fetchCities } from '../../api/OpenWeatherService';

// Custom dropdown indicator (magnifying glass)
const DropdownIndicator = (props) => (
  <components.DropdownIndicator {...props}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  </components.DropdownIndicator>
);

const Search = ({ onSearchChange }) => {
  const [searchValue, setSearchValue] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const loadOptions = useCallback(async (inputValue) => {
    const trimmedInput = (inputValue || '').trim();
    if (!trimmedInput || trimmedInput.length < 2) return [];
    
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      setIsLoading(true);
      const citiesList = await fetchCities(trimmedInput, abortControllerRef.current.signal);
      
      if (!citiesList?.data) {
        return [];
      }
      
      const options = citiesList.data.map((city) => ({
        value: `${city.latitude} ${city.longitude}`,
        label: `${city.name}, ${city.countryCode}`,
      }));
      
      return options;
    } catch (error) {
      if (error.name === 'AbortError') {
        return [];
      }
      
      // Handle rate limiting gracefully
      if (typeof error.message === 'string' && error.message.includes('Rate limit exceeded')) {
        return [];
      }
      
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onChangeHandler = (enteredData) => {
    setSearchValue(enteredData);
    // When an option is selected, show its label in the control
    if (enteredData?.label) {
      setInputText(enteredData.label);
    }
    
    // Always call parent handler - let parent decide what to do
    onSearchChange(enteredData);
  };

  // Abort any in-flight request when the component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <AsyncSelect
      placeholder="Search for cities (type at least 2 characters)"
      value={searchValue}
      onChange={onChangeHandler}
      inputValue={inputText}
      loadOptions={loadOptions}
      cacheOptions={true}
      defaultOptions={false}
      isClearable={false}
      isSearchable={true}
      isLoading={isLoading}
      aria-label="City search"
      noOptionsMessage={({ inputValue }) => 
        inputValue && inputValue.length < 2 
          ? "Type at least 2 characters to search" 
          : "No cities found"
      }
      loadingMessage={() => "Searching cities..."}
      components={{
        DropdownIndicator,
        IndicatorSeparator: () => null,
      }}
      onInputChange={(newValue, { action }) => {
        // Prevent clearing on menu close/open or when selecting option
        if (action === 'menu-close' || action === 'input-blur') return inputText;
        if (action === 'set-value' || action === 'input-change') {
          setInputText(newValue);
          return newValue;
        }
        return newValue;
      }}

    />
  );
};

export default Search;
