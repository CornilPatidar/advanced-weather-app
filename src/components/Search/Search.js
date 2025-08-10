// Search component: provides a city autocomplete field using react-select's AsyncSelect.
// As the user types, it fetches city suggestions from the API and lets the user pick one.
// Requests are safely cancelled as the input changes to avoid race conditions.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import AsyncSelect from 'react-select/async';
import { components } from 'react-select';
import { fetchCities } from '../../api/OpenWeatherService';

/** Minimum characters required before we start searching the API. */
const MIN_SEARCH_CHARACTERS = 2;

/**
 * Custom dropdown indicator (a magnifying glass icon) for the select component.
 */
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

/**
 * Search
 * Renders an async city search input. When the user selects a city, it calls
 * the provided `onSearchChange` callback with the selected option.
 */
const Search = ({ onSearchChange }) => {
  const [searchValue, setSearchValue] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Holds the AbortController for the most recent request so we can cancel it
  // when the user types something new or when the component unmounts.
  const abortControllerRef = useRef(null);

  /**
   * Converts a city object from the API into an option understood by react-select.
   */
  const transformCityToOption = useCallback((city) => ({
    value: `${city.latitude} ${city.longitude}`,
    label: `${city.name}, ${city.countryCode}`,
  }), []);

  /**
   * Called by AsyncSelect to fetch options based on current input.
   * - Returns early if there are not enough characters.
   * - Cancels the previous request before starting a new one.
   * - Maps API results into select options.
   */
  const loadOptions = useCallback(async (inputValue) => {
    const trimmedInput = (inputValue || '').trim();
    if (!trimmedInput || trimmedInput.length < MIN_SEARCH_CHARACTERS) return [];
    
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
      
      const options = citiesList.data.map(transformCityToOption);
      
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

  /**
   * When a user selects a city option, update the local state and notify parent.
   */
  const onChangeHandler = (selectedOption) => {
    setSearchValue(selectedOption);
    if (selectedOption?.label) {
      setInputText(selectedOption.label);
    }
    onSearchChange(selectedOption);
  };

  /**
   * Keep the input text in sync with what the user types.
   * Prevent the text from being cleared on blur/menu close to preserve UX.
   */
  const handleInputChange = useCallback((newValue, { action }) => {
    if (action === 'menu-close' || action === 'input-blur') {
      return inputText;
    }
    if (action === 'input-change') {
      setInputText(newValue);
      return newValue;
    }
    return newValue;
  }, [inputText]);

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
      placeholder={`Search for cities`}
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
      className="city-search"
      classNamePrefix="rs"
      // Helpful user-facing messages
      noOptionsMessage={({ inputValue }) => 
        inputValue && inputValue.length < MIN_SEARCH_CHARACTERS 
          ? `Type at least ${MIN_SEARCH_CHARACTERS} characters to search` 
          : "No cities found"
      }
      loadingMessage={() => "Searching cities..."}
      // Replace indicator and hide the separator for a cleaner look
      components={{
        DropdownIndicator,
        IndicatorSeparator: () => null,
      }}
      onInputChange={handleInputChange}

    />
  );
};

export default Search;

Search.propTypes = {
  onSearchChange: PropTypes.func.isRequired,
};
