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

const TABS_CONFIG = {
  index: {
    name: 'index',
    title: 'Tarefas',
    icon: Home,
    roles: ['admin', 'worker'],
  },
  admin: {
    name: 'admin',
    title: 'Admin',
    icon: Building2,
    roles: ['admin'],
  },
  progress: {
    name: 'progress',
    title: 'Progresso',
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
    title: 'Perfil',
    icon: User,
    roles: ['admin', 'worker'],
  },
};

function TabLayoutContent() {
  const { colors } = useTheme();
  const [userRole, setUserRole] = useState<'admin' | 'worker' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
          // User loaded
        }
      } catch (error) {
        console.error('Erro ao carregar role do usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };
    getUserRole();
  }, []);

  // Forçar atualização do role quando o componente montar
  useEffect(() => {
    const forceUpdateRole = async () => {
      if (!isLoading) {
        const role = await AuthService.getUserRole();
        if (userRole !== role) {
          setUserRole(role);
        }
      }
    };

    const timer = setTimeout(forceUpdateRole, 100);
    return () => clearTimeout(timer);
  }, [isLoading, userRole]);

  // Sempre que mudar de obra, atualiza o papel
  useEffect(() => {
    const updateRoleOnSiteChange = async () => {
      const role = await AuthService.getUserRole();
      setUserRole(role);
    };
    updateRoleOnSiteChange();
  }, [currentSite]);

  // Redirecionar colaborador se estiver em rota inválida
  useEffect(() => {
    if (userRole === 'worker' && !isLoading) {
      const currentTab = segments[segments.length - 1];
      if (currentTab === 'admin' || currentTab === 'chat') {
        router.replace('/(tabs)');
      }
    }
  }, [userRole, segments, isLoading]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // Se não tem role válido, não renderiza nada
  if (!userRole) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
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
          title: TABS_CONFIG.index.title,
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      
      {userRole === 'admin' && (
        <Tabs.Screen
          name="admin"
          options={{
            title: TABS_CONFIG.admin.title,
            tabBarIcon: ({ color, size }) => (
              <Building2 size={size} color={color} />
            ),
          }}
        />
      )}
      
      <Tabs.Screen
        name="progress"
        options={{
          title: TABS_CONFIG.progress.title,
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      
      {userRole === 'admin' && (
        <Tabs.Screen
          name="chat"
          options={{
            title: TABS_CONFIG.chat.title,
            tabBarIcon: ({ color, size }) => (
              <MessageCircle size={size} color={color} />
            ),
          }}
        />
      )}
      
      <Tabs.Screen
        name="profile"
        options={{
          title: TABS_CONFIG.profile.title,
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
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
