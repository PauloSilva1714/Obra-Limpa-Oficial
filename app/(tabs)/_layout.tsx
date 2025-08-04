import { Tabs, useRouter, useSegments } from 'expo-router';
import { useColorScheme, View, Text, StyleSheet } from 'react-native';
import {
  Home,
  User,
  BarChart3,
  Building2,
  MessageCircle
} from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/config/i18n';
import { useSite } from '@/contexts/SiteContext';

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  const { colors, isDarkMode } = useTheme();
  const [userRole, setUserRole] = useState<'admin' | 'worker' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(0);
  const router = useRouter();
  const segments = useSegments();
  const { currentSite } = useSite();

  useEffect(() => {
    const getUserRole = async () => {
      try {
        await AuthService.debugAsyncStorage();
        const role = await AuthService.getUserRole();
        setUserRole(role);
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    getUserRole();
  }, []);

  useEffect(() => {
    const forceUpdateRole = async () => {
      if (!isLoading) {
        const role = await AuthService.getUserRole();
        if (userRole !== role) {
          setUserRole(role);
          setRenderKey(prev => prev + 1);
        }
      }
    };
    const timer = setTimeout(forceUpdateRole, 100);
    return () => clearTimeout(timer);
  }, [isLoading, userRole]);

  useEffect(() => {
    const updateRoleOnSiteChange = async () => {
      const role = await AuthService.getUserRole();
      setUserRole(role);
      setRenderKey(prev => prev + 1);
    };
    updateRoleOnSiteChange();
  }, [currentSite]);

  useEffect(() => {
    if (userRole === 'worker' && !isLoading) {
      const currentTab = segments[segments.length - 1];
      if (currentTab === 'admin' || currentTab === 'chat') {
        router.replace('/(tabs)');
      }
    }
  }, [userRole, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!userRole) return null;

  return (
    <Tabs
      key={renderKey}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tarefas',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      
      {userRole === 'admin' && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => <Building2 size={size} color={color} />,
          }}
        />
      )}
      
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      
      {userRole === 'admin' && (
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          }}
        />
      )}
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <TabLayoutContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Medium',
  },
});
