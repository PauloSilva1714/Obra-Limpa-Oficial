import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { 
  Home, 
  User, 
  BarChart3, 
  Building2,
  MessageCircle 
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/config/i18n';

interface CustomTabBarProps {
  userRole: 'admin' | 'worker' | null;
  isVisible: boolean;
}

const TABS_CONFIG = {
  index: {
    name: 'index',
    title: t('tasks'),
    icon: Home,
    roles: ['admin', 'worker'],
  },
  admin: {
    name: 'admin',
    title: t('admin'),
    icon: Building2,
    roles: ['admin'],
  },
  progress: {
    name: 'progress',
    title: t('progress'),
    icon: BarChart3,
    roles: ['admin', 'worker'],
  },
  chat: {
    name: 'chat',
    title: 'Chat',
    icon: MessageCircle,
    roles: ['admin'],
  },
  profile: {
    name: 'profile',
    title: t('profile'),
    icon: User,
    roles: ['admin', 'worker'],
  },
};

export default function CustomTabBar({ userRole, isVisible }: CustomTabBarProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  
  if (!isVisible || !userRole) {
    return null;
  }

  const currentTab = segments[segments.length - 1] || 'index';

  const availableTabs = Object.entries(TABS_CONFIG).filter(([_, config]) => 
    config.roles.includes(userRole)
  );

  const handleTabPress = (tabName: string) => {
    router.push(`/(tabs)/${tabName === 'index' ? '' : tabName}` as any);
  };

  return (
    <Animated.View style={[
      styles.container,
      { 
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
      }
    ]}>
      {availableTabs.map(([tabKey, config]) => {
        const isActive = currentTab === config.name || (!currentTab && config.name === 'index');
        const IconComponent = config.icon;
        
        return (
          <TouchableOpacity
            key={tabKey}
            style={styles.tab}
            onPress={() => handleTabPress(config.name)}
            activeOpacity={0.7}
          >
            <IconComponent
              size={24}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text style={[
              styles.tabText,
              {
                color: isActive ? colors.primary : colors.textMuted,
                fontWeight: isActive ? '600' : '400',
              }
            ]}>
              {config.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
});