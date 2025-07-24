import { Tabs, useRouter, useSegments } from 'expo-router';
import { useColorScheme, View, Text, StyleSheet } from 'react-native';
import { 
  Home, 
  User, 
  BarChart3, 
  Camera, 
  Users,
  Building2,
  MessageCircle // Adiciona ícone de chat
} from 'lucide-react-native';
import { AuthService } from '@/services/AuthService';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { t } from '@/config/i18n';
import { useSite } from '@/contexts/SiteContext';
import CustomTabBar from '@/components/CustomTabBar';
import { Slot } from 'expo-router';
import { TabBarProvider, useTabBar } from '@/contexts/TabBarContext';

const TABS_CONFIG = {
  index: {
    name: 'index',
    title: t('tasks'),
    icon: Home,
  },
  admin: {
    name: 'admin',
    title: t('admin'),
    icon: Building2,
  },
  progress: {
    name: 'progress',
    title: t('progress'),
    icon: BarChart3,
  },
  chat: {
    name: 'chat',
    title: 'Chat',
    icon: MessageCircle,
  },
  profile: {
    name: 'profile',
    title: t('profile'),
    icon: User,
  },
};

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  const { colors, isDarkMode } = useTheme();
  const [userRole, setUserRole] = useState<'admin' | 'worker' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(0); // Forçar re-render
  const router = useRouter();
  const segments = useSegments();
  const { currentSite } = useSite();
  const { isTabBarVisible } = useTabBar();

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

  // Forçar atualização do role quando o componente montar
  useEffect(() => {
    const forceUpdateRole = async () => {
      if (!isLoading) {
        const role = await AuthService.getUserRole();
        
        if (userRole !== role) {
          setUserRole(role);
          setRenderKey(prev => prev + 1); // Forçar re-render
        }
      }
    };
    
    // Aguardar um pouco para garantir que o AsyncStorage foi carregado
    const timer = setTimeout(forceUpdateRole, 100);
    return () => clearTimeout(timer);
  }, [isLoading, userRole]);

  // Sempre que mudar de obra, atualiza o papel e força re-render
  useEffect(() => {
    const updateRoleOnSiteChange = async () => {
      const role = await AuthService.getUserRole();
      setUserRole(role);
      setRenderKey(prev => prev + 1);
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
  if (!userRole) return null; // ou um loading

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingBottom: isTabBarVisible ? 64 : 0 }]}>
        <Slot />
      </View>
      <CustomTabBar userRole={userRole} isVisible={isTabBarVisible} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <TabBarProvider>
      <TabLayoutContent />
    </TabBarProvider>
  );
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
