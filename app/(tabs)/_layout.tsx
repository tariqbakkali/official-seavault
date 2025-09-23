import { Tabs } from 'expo-router';
import { Fish, Grid3x3, Plus, User } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import { TAB_CONFIG, COLORS, DIMENSIONS } from '@/constants';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_DISABLED,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name={TAB_CONFIG.HOME.name}
        options={{
          title: TAB_CONFIG.HOME.title,
          tabBarIcon: ({ color, size }) => (
            <Fish size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name={TAB_CONFIG.CATEGORIES.name}
        options={{
          title: TAB_CONFIG.CATEGORIES.title,
          tabBarIcon: ({ color, size }) => (
            <Grid3x3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name={TAB_CONFIG.LOG_DIVE.name}
        options={{
          title: TAB_CONFIG.LOG_DIVE.title,
          tabBarIcon: ({ color, size }) => (
            <Plus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name={TAB_CONFIG.PROFILE.name}
        options={{
          title: TAB_CONFIG.PROFILE.title,
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
    backgroundColor: COLORS.SURFACE,
    borderTopColor: COLORS.BORDER_PRIMARY,
    borderTopWidth: 1,
    height: DIMENSIONS.TAB_BAR_HEIGHT,
    paddingBottom: DIMENSIONS.SPACE_XXL,
    paddingTop: DIMENSIONS.SPACE_SM,
  },
  tabLabel: {
    fontSize: DIMENSIONS.SPACE_SM + 2,
    fontWeight: '500',
  },
});