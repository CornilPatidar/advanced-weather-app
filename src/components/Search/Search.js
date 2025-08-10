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
  // Debounce timer to avoid firing requests on every keystroke
  const debounceTimeoutRef = useRef(null);

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
  const loadOptions = useCallback((inputValue) => {
    const trimmedInput = (inputValue || '').trim();
    if (!trimmedInput || trimmedInput.length < MIN_SEARCH_CHARACTERS) {
      return Promise.resolve([]);
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    return new Promise((resolve) => {
      setIsLoading(true);
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          const citiesList = await fetchCities(trimmedInput, abortControllerRef.current.signal);
          if (!citiesList?.data) {
            resolve([]);
            return;
          }
          const options = citiesList.data.map(transformCityToOption);
          resolve(options);
        } catch (error) {
          console.warn('City search failed:', error);
          resolve([]);
        } finally {
          setIsLoading(false);
        }
      }, 250);
    });
  }, [transformCityToOption]);

  /**
   * When a user selects a city option, update the local state and notify parent.
   */
  const onChangeHandler = (selectedOption) => {
    setSearchValue(selectedOption);
    // If cleared via the clear icon or programmatically
    if (!selectedOption) {
      setInputText('');
      onSearchChange(null);
      return;
    }
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
      // If the user cleared the text manually, clear the selected value and inform parent
      if ((newValue || '').trim() === '') {
        setSearchValue(null);
        onSearchChange(null);
      }
      return newValue;
    }
    return newValue;
  }, [inputText, onSearchChange]);

  // Abort any in-flight request and clear pending debounce when the component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
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
      cacheOptions={false}
      defaultOptions={false}
      isClearable={true}
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
