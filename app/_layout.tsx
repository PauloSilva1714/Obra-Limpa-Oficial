// 🚨 INTERCEPTADOR ULTRA AGRESSIVO - EXECUÇÃO IMEDIATA
(function() {
  'use strict';

  console.log('🔥 INTERCEPTADOR ULTRA AGRESSIVO - INICIANDO');

  // Função para interceptar fetch
  function setupFetchInterceptor() {
    if (typeof window !== 'undefined' && window.fetch) {
      const originalFetch = window.fetch;

      window.fetch = function(input, init) {
        let url;

        // Extrair URL de diferentes tipos de input
        if (typeof input === 'string') {
          url = input;
        } else if (input instanceof URL) {
          url = input.toString();
        } else if (input instanceof Request) {
          url = input.url;
        } else {
          url = String(input);
        }

        // INTERCEPTAR APENAS SE NÃO FOR JAVASCRIPT API E NÃO ESTIVER SENDO TRATADA PELO google-places.ts
    if (url && url.includes('maps.googleapis.com') &&
        !url.includes('js?') &&
        !(url.includes('/place/') || url.includes('/geocode/'))) {
           console.log('🚫 INTERCEPTADOR ULTRA - BLOQUEANDO:', url);

           // Lista de proxies para tentar em ordem
           const proxies = [
             'https://corsproxy.io/?',
             'https://api.allorigins.win/raw?url=',
             'https://cors-proxy.htmldriven.com/?url=',
             'https://thingproxy.freeboard.io/fetch/'
           ];

           // Função para tentar cada proxy
           const tryProxy = async (proxyIndex = 0) => {
             if (proxyIndex >= proxies.length) {
               throw new Error('Todos os proxies falharam');
             }

             const proxy = proxies[proxyIndex];
             let proxyUrl;

             if (proxy.includes('allorigins') || proxy.includes('corsproxy.io') || proxy.includes('htmldriven')) {
               proxyUrl = proxy + encodeURIComponent(url);
             } else {
               proxyUrl = proxy + url;
             }

             console.log(`✅ TENTANDO PROXY ${proxyIndex + 1}/${proxies.length}:`, proxyUrl);

             try {
               const response = await originalFetch(proxyUrl, {
                 ...init,
                 headers: {
                   ...init?.headers,
                   'Content-Type': 'application/json'
                 }
               });

               if (response.ok) {
                 console.log(`✅ PROXY ${proxyIndex + 1} FUNCIONOU!`);
                 return response;
               } else {
                 throw new Error(`Proxy ${proxyIndex + 1} retornou status ${response.status}`);
               }
             } catch (error) {
               console.log(`❌ PROXY ${proxyIndex + 1} FALHOU:`, error.message);
               return tryProxy(proxyIndex + 1);
             }
           };

           return tryProxy();
         }

        return originalFetch(input, init);
      };

      console.log('✅ INTERCEPTADOR FETCH INSTALADO');
    }
  }

  // Função para interceptar XMLHttpRequest
  function setupXHRInterceptor() {
    if (typeof window !== 'undefined' && window.XMLHttpRequest) {
      const originalXHR = window.XMLHttpRequest;

      window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;

        xhr.open = function(method, url, ...args) {
           // Log todas as chamadas para Google Maps para debug
           if (typeof url === 'string' && url.includes('maps.googleapis.com')) {
             console.log('🔍 [XHR INTERCEPTADOR] Chamada para Google Maps detectada:', url);
             console.log('🔍 [XHR INTERCEPTADOR] Contém js?:', url.includes('js?'));
             console.log('🔍 [XHR INTERCEPTADOR] Contém /place/:', url.includes('/place/'));
             console.log('🔍 [XHR INTERCEPTADOR] Contém /geocode/:', url.includes('/geocode/'));
           }

           // Interceptar APENAS chamadas REST API (que contêm /place/ ou /geocode/) e NÃO contêm js?
           if (typeof url === 'string' && url.includes('maps.googleapis.com') &&
            (url.includes('/place/') || url.includes('/geocode/')) &&
            !url.includes('js?')) {
             console.log('🚫 [XHR INTERCEPTADOR] INTERCEPTANDO CHAMADA REST:', url);
             const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
             return originalOpen.call(this, method, proxyUrl, ...args);
           } else if (typeof url === 'string' && url.includes('maps.googleapis.com')) {
             // Para chamadas JavaScript API, usar proxy diferente
             console.log('🚫 [XHR INTERCEPTADOR] INTERCEPTANDO CHAMADA JAVASCRIPT:', url);
             const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
             return originalOpen.call(this, method, proxyUrl, ...args);
           }

           return originalOpen.call(this, method, url, ...args);
        };

        return xhr;
      };

      console.log('✅ INTERCEPTADOR XHR INSTALADO');
    }
  }

  // Configurar interceptadores
  setupFetchInterceptor();
  setupXHRInterceptor();

  console.log('✅ INTERCEPTADOR ULTRA AGRESSIVO CONFIGURADO');
})();

import '@/config/pointer-events-fix';
import '@/config/passive-events';
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
    if (typeof document !== 'undefined') {
      document.title = 'Obra Limpa';
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);
    }
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
              <Stack.Screen name="(worker-tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin-tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </TabBarProvider>
        </SiteProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
