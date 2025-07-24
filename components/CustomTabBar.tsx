import { View, TouchableOpacity, Text, StyleSheet, Platform, useWindowDimensions, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, User, BarChart3, MessageCircle, Building2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { AdminService } from '@/services/AdminService';
import { AuthService } from '@/services/AuthService';
import { shadows } from '../utils/shadowUtils';

interface CustomTabBarProps {
  userRole: 'admin' | 'worker';
  isVisible?: boolean;
}

export default function CustomTabBar({ userRole, isVisible = true }: CustomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 500;

  // Animação para esconder/mostrar tab bar
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Estado para contagem dinâmica de mensagens não lidas
  const [chatBadge, setChatBadge] = useState(0);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : 80, // 80 é a altura da tab bar + margem
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupUnreadMessagesSubscription = async () => {
      if (userRole === 'admin') {
        try {
          const currentSite = await AuthService.getCurrentSite();
          if (currentSite?.id) {
            unsubscribe = await AdminService.subscribeToUnreadDirectMessagesCount(
              currentSite.id,
              (count: number) => {
                setChatBadge(count);
              }
            );
          }
        } catch (error) {
          console.error('Erro ao configurar inscrição de mensagens não lidas:', error);
        }
      }
    };

    setupUnreadMessagesSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userRole]);

  const tabs = [
    { name: 'Tarefas', icon: <Home size={isSmallScreen ? 22 : 28} color={colors.primary} />, route: '/', show: true },
    { name: 'Admin', icon: <Building2 size={isSmallScreen ? 22 : 28} color={colors.primary} />, route: '/admin', show: userRole === 'admin' },
    { name: 'Progresso', icon: <BarChart3 size={isSmallScreen ? 22 : 28} color={colors.primary} />, route: '/progress', show: true },
    { name: 'Chat', icon: <MessageCircle size={isSmallScreen ? 22 : 28} color={colors.primary} />, route: '/chat', show: userRole === 'admin', badge: chatBadge },
    { name: 'Perfil', icon: <User size={isSmallScreen ? 22 : 28} color={colors.primary} />, route: '/profile', show: true },
  ].filter(tab => tab.show);

  return (
    <Animated.View 
      style={[
        styles.tabBar, 
        { 
          backgroundColor: colors.surface, 
          borderTopColor: colors.border,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    > 
      {tabs.map(tab => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            style={[
              styles.tab,
              isActive && { backgroundColor: isDarkMode ? '#111827' : '#F3F4F6', borderTopColor: colors.primary, borderTopWidth: 3 },
              { paddingVertical: isSmallScreen ? 6 : 12 }
            ]}
            activeOpacity={0.7}
            onPress={() => router.push(tab.route)}
          >
            <View style={styles.iconContainer}>
              {tab.icon}
              {/* Badge de notificação */}
              {tab.badge && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
            {/* Texto responsivo: menor ou oculto em telas pequenas */}
            {!isSmallScreen && (
              <Text style={[styles.tabText, isActive && { color: colors.primary }]}> {tab.name} </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    boxShadow: '0px -4px 6px rgba(0,0,0,0.1)',
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    borderRadius: 0,
    minWidth: 60,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});