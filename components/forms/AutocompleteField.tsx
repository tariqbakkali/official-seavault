import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

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
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch suggestions from Google Places API
  const fetchSuggestions = async (input: string) => {
    if (!input.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      // Get API key from environment
      const apiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Construct the API URL for Places Autocomplete (worldwide search)
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=geocode`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle text input with debouncing
  const handleTextChange = (text: string) => {
    onChangeText(text);
    
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(text);
    }, debounceDelay);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    onChangeText(suggestion.description);
    setShowSuggestions(false);
    // Call the parent handler after a short delay to ensure state is updated
    setTimeout(() => {
      try {
        onSuggestionSelect(suggestion);
      } catch (error) {
        console.error('[DEBUG] AutocompleteField: Error in parent onSuggestionSelect', error);
      }
    }, 50);
  };

  // Hide suggestions when input loses focus (with slight delay to allow tap)
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  // Show suggestions when input gains focus and has text
  const handleFocus = () => {
    if (value.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (value.trim()) {
      // If there's text but no suggestions, fetch them
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
              return (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
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
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  label: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
    color: '#fff',
    marginBottom: DIMENSIONS.SPACE_SM,
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
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.PADDING_SM,
    backgroundColor: '#1a1a1a',
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#fff',
    paddingRight: 40,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  loadingIndicator: {
    position: 'absolute',
    right: DIMENSIONS.PADDING_SM,
    top: DIMENSIONS.PADDING_SM,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: DIMENSIONS.RADIUS_SM,
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
    padding: DIMENSIONS.PADDING_SM,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  suggestionText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#fff',
  },
  suggestionSubtext: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#999',
    marginTop: DIMENSIONS.SPACE_XS,
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#ff3b30',
    fontStyle: 'italic',
    marginTop: DIMENSIONS.SPACE_XS,
  },
});

export default AutocompleteField;