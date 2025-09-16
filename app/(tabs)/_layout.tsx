import { Tabs } from 'expo-router';
import { Fish, Grid3x3, Plus, User } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Fish size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => (
            <Grid3x3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="log-dive"
        options={{
          title: 'Log a Dive',
          tabBarIcon: ({ color, size }) => (
            <Plus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
    borderTopWidth: 1,
    height: 88,
    paddingBottom: 24,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});