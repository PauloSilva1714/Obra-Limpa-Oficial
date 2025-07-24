import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Menu, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabBar } from '@/contexts/TabBarContext';

interface TabBarToggleButtonProps {
  size?: number;
  style?: any;
}

export default function TabBarToggleButton({ size = 24, style }: TabBarToggleButtonProps) {
  const { colors } = useTheme();
  const { isTabBarVisible, toggleTabBar } = useTabBar();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.primary }, style]}
      onPress={toggleTabBar}
      activeOpacity={0.8}
    >
      {isTabBarVisible ? (
        <X size={size} color="white" />
      ) : (
        <Menu size={size} color="white" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});