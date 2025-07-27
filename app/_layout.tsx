import '@/config/pointer-events-fix';
import '@/config/console';
import '@/config/react-native-web';
import '@/config/expo-router';
import '@/config/expo-notifications';
import { useEffect, useState } from 'react';
import { Stack, Slot } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { loadSavedLanguage } from '@/config/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { SiteProvider } from '@/contexts/SiteContext';
import { TabBarProvider } from '@/contexts/TabBarContext';
import { setupGlobalErrorHandler } from '@/config/error-handler';
import { ConnectionStatus } from '@/components/ConnectionStatus';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Carregar idioma salvo de forma segura
        await loadSavedLanguage();
      } catch (error) {
        console.error('Erro ao inicializar app:', error);
        // Continuar mesmo com erro
      }
    };

    if (fontsLoaded || fontError) {
      initializeApp().finally(() => {
        SplashScreen.hideAsync();
        setIsLoading(false);
      });
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    document.title = 'Obra Limpa';
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = '/favicon.ico';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    // Configurar handler global de erros
    setupGlobalErrorHandler();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <SiteProvider>
          <TabBarProvider>
            <Head>
              <title>Obra Limpa</title>
              <meta
                name="description"
                content="Sistema de gerenciamento de obras e tarefas"
              />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1, maximum-scale=1"
              />
              <meta name="theme-color" content="#ffffff" />
              <link rel="icon" href="/favicon.ico" />
              <link rel="apple-touch-icon" href="/icon.png" />
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            </Head>
            
            {/* Status de conexão - apenas em desenvolvimento */}
            {/* Removido ConnectionStatus do topo global, agora aparece apenas na tela de tarefas */}
            
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/site-selection" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </TabBarProvider>
        </SiteProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
