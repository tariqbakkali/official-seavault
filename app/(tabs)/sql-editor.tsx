import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '@/services/supabase';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { parseQuery, ParsedQuery } from '@/utils/queryParser';
import { PostgrestError } from '@supabase/supabase-js';

// Define types for our data
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  membership_tier: string | null;
  is_premium: boolean | null;
  has_seen_onboarding: boolean | null;
  created_at: string;
}

interface DebugSection {
  section: string;
  data: Record<string, string>;
}

export default function SQLEditorScreen() {
  const [query, setQuery] = useState('SELECT * FROM profiles;');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeQuery = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a query');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      // Parse the query
      const parsedQuery: ParsedQuery = parseQuery(query);
      
      if (parsedQuery.operation !== 'SELECT') {
        throw new Error('Only SELECT queries are supported');
      }
      
      // Build Supabase query
      let supabaseQuery = supabase.from(parsedQuery.tableName).select(
        parsedQuery.columns.includes('*') ? '*' : parsedQuery.columns.join(',')
      );
      
      // Add WHERE clause if present
      if (parsedQuery.where) {
        const { column, operator, value } = parsedQuery.where;
        switch (operator) {
          case '=':
            supabaseQuery = supabaseQuery.eq(column, value);
            break;
          case '!=':
            supabaseQuery = supabaseQuery.neq(column, value);
            break;
          case '<':
            supabaseQuery = supabaseQuery.lt(column, value);
            break;
          case '>':
            supabaseQuery = supabaseQuery.gt(column, value);
            break;
          case '<=':
            supabaseQuery = supabaseQuery.lte(column, value);
            break;
          case '>=':
            supabaseQuery = supabaseQuery.gte(column, value);
            break;
          default:
            throw new Error(`Unsupported operator: ${operator}`);
        }
      }
      
      // Add LIMIT if present
      if (parsedQuery.limit) {
        supabaseQuery = supabaseQuery.limit(parsedQuery.limit);
      }
      
      // Execute the query
      const { data, error } = await supabaseQuery;
      
      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      console.error('SQL Error:', err);
      setError(err.message || 'An error occurred while executing the query');
    } finally {
      setLoading(false);
    }
  };

  // Function to check if there are any users
  const checkUsers = async () => {
    try {
      setLoading(true);
      setError('');
      setResults([]);
      
      // First check if we have any authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Info', 'No authenticated user. Please sign in first.');
        setLoading(false);
        return;
      }
      
      // Check profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, created_at');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setResults(data);
        Alert.alert('Info', `Found ${data.length} user profiles in the database.`);
      } else {
        Alert.alert('Info', 'No profiles found. The profile creation trigger may not be working, or no users have been created yet.');
        setResults([]);
      }
    } catch (err: any) {
      console.error('Check users error:', err);
      setError(err.message || 'An error occurred while checking users');
    } finally {
      setLoading(false);
    }
  };

  // Function to test profile creation
  const testProfileCreation = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First check if we have an authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Info', 'No authenticated user. Please sign in first.');
        setLoading(false);
        return;
      }
      
      // Try to get the current user's profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setResults([data]);
        Alert.alert('Info', 'Found your profile!');
      } else {
        // Try to create a profile manually
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: null,
            avatar_url: null,
            membership_tier: null,
            is_premium: false,
            has_seen_onboarding: false
          } as Profile)
          .select()
          .maybeSingle();
        
        if (insertError) {
          throw insertError;
        }
        
        if (insertData) {
          setResults([insertData]);
          Alert.alert('Success', 'Created your profile manually!');
        } else {
          Alert.alert('Info', 'Profile creation may be restricted by RLS policies. The database trigger should create it automatically after email confirmation.');
        }
      }
    } catch (err: any) {
      console.error('Test profile creation error:', err);
      setError(err.message || 'An error occurred while testing profile creation');
      Alert.alert('Error', `Profile creation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to debug profile creation issues
  const debugProfileCreation = async () => {
    try {
      setLoading(true);
      setError('');
      setResults([]);
      
      // Check auth state
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Info', 'No authenticated user. Please sign in first.');
        setLoading(false);
        return;
      }
      
      // Check if user exists in auth.users
      const { data: authUsers, error: authError } = await supabase
        .from('users')
        .select('id, email, created_at, confirmed_at')
        .eq('id', user.id)
        .maybeSingle();
      
      if (authError) {
        console.log('Auth users check error:', authError);
        // This might fail because we can't directly access auth schema
      }
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      const debugInfo: DebugSection[] = [
        {
          section: 'Authentication Status',
          data: {
            'Authenticated': 'Yes',
            'User ID': user.id,
            'Email': user.email || 'N/A',
            'Confirmed': user.confirmed_at ? 'Yes' : 'No'
          }
        },
        {
          section: 'Profile Status',
          data: profile ? {
            'Profile Exists': 'Yes',
            'Profile ID': profile.id,
            'Profile Email': profile.email || 'N/A',
            'Created At': profile.created_at
          } : {
            'Profile Exists': 'No',
            'Reason': 'Profile not found in database'
          }
        }
      ];
      
      setResults(debugInfo);
      Alert.alert('Debug Info', 'Check the results panel for detailed debug information.');
    } catch (err: any) {
      console.error('Debug profile creation error:', err);
      setError(err.message || 'An error occurred while debugging profile creation');
    } finally {
      setLoading(false);
    }
  };

  // Function to fix database issues
  const fixDatabaseIssues = async () => {
    try {
      setLoading(true);
      setError('');
      
      Alert.alert(
        'Database Fix',
        'To fix database issues, please run the fix_profile_trigger.sql script in your Supabase SQL editor. This will ensure the profile creation trigger is working correctly.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (err: any) {
      console.error('Fix database error:', err);
      setError(err.message || 'An error occurred while preparing database fix');
    } finally {
      setLoading(false);
    }
  };

  const formatResults = () => {
    if (results.length === 0) return 'No results';
    
    // Check if this is debug info format
    if (results.length > 0 && results[0].section) {
      return (
        <View style={styles.debugContainer}>
          {(results as DebugSection[]).map((section, index) => (
            <View key={index} style={styles.debugSection}>
              <Text style={styles.debugSectionTitle}>{section.section}</Text>
              {Object.entries(section.data).map(([key, value], idx) => (
                <View key={idx} style={styles.debugRow}>
                  <Text style={styles.debugKey}>{key}:</Text>
                  <Text style={styles.debugValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    // Get all unique keys from all rows for table headers
    const allKeys = new Set<string>();
    results.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });
    const headers = Array.from(allKeys);

    return (
      <ScrollView horizontal>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRow}>
            {headers.map((key) => (
              <Text key={`header-${key}`} style={[styles.tableCell, styles.tableHeader]}>
                {key.toString()}
              </Text>
            ))}
          </View>
          {/* Data rows */}
          {results.map((row, index) => (
            <View key={`row-${index}`} style={styles.tableRow}>
              {headers.map((key, cellIndex) => (
                <Text key={`cell-${index}-${cellIndex}`} style={styles.tableCell}>
                  {row[key] !== undefined && row[key] !== null ? String(row[key]) : 'NULL'}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQL Editor</Text>
      
      <View style={styles.editorContainer}>
        <Text style={styles.subtitle}>Supported Tables: profiles, creatures, categories, sightings, wishlists, achievements</Text>
        <Text style={styles.infoText}>Supported syntax: SELECT columns FROM table [WHERE condition] [LIMIT number]</Text>
        <Text style={styles.exampleText}>Example: SELECT * FROM creatures WHERE name = 'Shark' LIMIT 10</Text>
        
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Enter your SELECT query here..."
          placeholderTextColor={COLORS.TEXT_TERTIARY}
          value={query}
          onChangeText={setQuery}
          editable={!loading}
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.executeButton, loading && styles.buttonDisabled]}
            onPress={executeQuery}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Executing...' : 'Execute Query'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.checkUsersButton, loading && styles.buttonDisabled]}
            onPress={checkUsers}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Check Users</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.testButton, loading && styles.buttonDisabled]}
            onPress={testProfileCreation}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Profile Creation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.debugButton, loading && styles.buttonDisabled]}
            onPress={debugProfileCreation}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Debug Profile</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.fixButton, loading && styles.buttonDisabled]}
          onPress={fixDatabaseIssues}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Fix Database Issues</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Results ({results.length} rows)</Text>
        <ScrollView>
          {results.length > 0 ? formatResults() : (
            <Text style={styles.noResultsText}>Execute a query to see results</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: DIMENSIONS.PADDING_HORIZONTAL,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD as any,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_LG,
    marginTop: DIMENSIONS.SPACE_LG,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  infoText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  exampleText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.PRIMARY,
    marginBottom: DIMENSIONS.SPACE_MD,
    fontStyle: 'italic',
  },
  editorContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_MD,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  textInput: {
    backgroundColor: COLORS.SURFACE_SECONDARY,
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_MD,
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DIMENSIONS.SPACE_MD,
  },
  executeButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_MD,
    alignItems: 'center',
    flex: 1,
    marginRight: DIMENSIONS.SPACE_SM,
  },
  checkUsersButton: {
    backgroundColor: COLORS.SECONDARY,
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_MD,
    alignItems: 'center',
    flex: 1,
    marginLeft: DIMENSIONS.SPACE_SM,
  },
  testButton: {
    backgroundColor: COLORS.INFO,
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_MD,
    alignItems: 'center',
    flex: 1,
    marginRight: DIMENSIONS.SPACE_SM,
  },
  debugButton: {
    backgroundColor: COLORS.WARNING,
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_MD,
    alignItems: 'center',
    flex: 1,
    marginLeft: DIMENSIONS.SPACE_SM,
  },
  fixButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_MD,
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACE_MD,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD as any,
  },
  errorContainer: {
    backgroundColor: COLORS.ERROR + '20',
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_MD,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_MD,
  },
  resultsTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD as any,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  noResultsText: {
    color: COLORS.TEXT_TERTIARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    textAlign: 'center',
    marginTop: DIMENSIONS.SPACE_LG,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  tableHeader: {
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD as any,
    backgroundColor: COLORS.SURFACE_SECONDARY,
  },
  tableCell: {
    padding: DIMENSIONS.SPACE_SM,
    minWidth: 120,
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER_PRIMARY,
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_SM,
  },
  debugContainer: {
    padding: DIMENSIONS.SPACE_MD,
  },
  debugSection: {
    marginBottom: DIMENSIONS.SPACE_LG,
    backgroundColor: COLORS.SURFACE_SECONDARY,
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_MD,
  },
  debugSectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD as any,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  debugRow: {
    flexDirection: 'row',
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  debugKey: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD as any,
    width: 150,
  },
  debugValue: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
});