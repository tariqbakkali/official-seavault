import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { COLORS, DIMENSIONS } from '@/constants';

interface AutocompleteSuggestion {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface AutocompleteFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  onSuggestionSelect: (suggestion: AutocompleteSuggestion) => void;
  debounceDelay?: number;
}

/**
 * Autocomplete field component with Google Places API integration
 */
const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  error,
  onSuggestionSelect,
  debounceDelay = 300,
}) => {
  console.log('[DEBUG] AutocompleteField: Component rendered with value', value);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch suggestions from Google Places API
  const fetchSuggestions = async (input: string) => {
    console.log('[DEBUG] AutocompleteField: fetchSuggestions called with input', input);
    if (!input.trim()) {
      console.log('[DEBUG] AutocompleteField: Input is empty, clearing suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      // Get API key from environment
      const apiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('[DEBUG] AutocompleteField: Google Maps API key not found');
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Construct the API URL for Places Autocomplete (worldwide search)
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=geocode`;
      
      console.log('[DEBUG] AutocompleteField: Fetching suggestions from', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('[DEBUG] AutocompleteField: Suggestions response', data);
      
      if (data.predictions) {
        console.log('[DEBUG] AutocompleteField: Setting suggestions', data.predictions);
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        console.log('[DEBUG] AutocompleteField: No predictions found, clearing suggestions');
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('[DEBUG] AutocompleteField: Error fetching autocomplete suggestions', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle text input with debouncing
  const handleTextChange = (text: string) => {
    console.log('[DEBUG] AutocompleteField: handleTextChange called with', text);
    onChangeText(text);
    console.log('[DEBUG] AutocompleteField: Parent onChangeText called with', text);
    
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      console.log('[DEBUG] AutocompleteField: Debounced fetchSuggestions for', text);
      fetchSuggestions(text);
    }, debounceDelay);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    console.log('[DEBUG] AutocompleteField: Suggestion selected', suggestion);
    console.log('[DEBUG] AutocompleteField: Setting text to', suggestion.description);
    onChangeText(suggestion.description);
    setShowSuggestions(false);
    console.log('[DEBUG] AutocompleteField: Text set to', suggestion.description);
    console.log('[DEBUG] AutocompleteField: Suggestions hidden');
    // Call the parent handler after a short delay to ensure state is updated
    setTimeout(() => {
      console.log('[DEBUG] AutocompleteField: Calling parent onSuggestionSelect with', suggestion);
      try {
        onSuggestionSelect(suggestion);
        console.log('[DEBUG] AutocompleteField: Parent onSuggestionSelect completed successfully');
      } catch (error) {
        console.error('[DEBUG] AutocompleteField: Error in parent onSuggestionSelect', error);
      }
    }, 50);
  };

  // Hide suggestions when input loses focus (with slight delay to allow tap)
  const handleBlur = () => {
    console.log('[DEBUG] AutocompleteField: Input lost focus');
    setTimeout(() => {
      console.log('[DEBUG] AutocompleteField: Hiding suggestions after blur delay');
      setShowSuggestions(false);
    }, 150);
  };

  // Show suggestions when input gains focus and has text
  const handleFocus = () => {
    console.log('[DEBUG] AutocompleteField: Input gained focus with value', value);
    if (value.trim() && suggestions.length > 0) {
      console.log('[DEBUG] AutocompleteField: Showing existing suggestions');
      setShowSuggestions(true);
    } else if (value.trim()) {
      // If there's text but no suggestions, fetch them
      console.log('[DEBUG] AutocompleteField: Fetching suggestions for existing text');
      fetchSuggestions(value);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
        
        {loading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          </View>
        )}
      </View>
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer} onStartShouldSetResponder={() => {
          console.log('[DEBUG] AutocompleteField: Suggestions container touched');
          return false;
        }}>
          <FlatList
            ref={flatListRef}
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            scrollEnabled={false} // Disable scrolling to prevent conflict with parent ScrollView
            renderItem={({ item }) => {
              console.log('[DEBUG] AutocompleteField: Rendering suggestion item', item);
              return (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    console.log('[DEBUG] AutocompleteField: Suggestion item pressed', item);
                    handleSuggestionSelect(item);
                  }}
                >
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {item.structured_formatting?.main_text || item.description}
                  </Text>
                  {item.structured_formatting?.secondary_text && (
                    <Text style={styles.suggestionSubtext} numberOfLines={1}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }}
            style={styles.suggestionsList}
          />
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  required: {
    color: '#ff3b30',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#1a1a1a',
    fontSize: 16,
    color: '#fff',
    paddingRight: 40,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    zIndex: 1000,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  suggestionText: {
    fontSize: 16,
    color: '#fff',
  },
  suggestionSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export default AutocompleteField;