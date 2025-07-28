// Configuração específica para Expo Notifications
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Verificar se está rodando no Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Configuração para resolver problemas do Expo Notifications
if (Platform.OS === 'web' || isExpoGo) {
  // Suprimir avisos específicos do Expo Notifications
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Lista de avisos específicos do Expo Notifications para suprimir
    const suppressedWarnings = [
      'expo-notifications] Listening to push token changes is not yet fully supported on web',
      'expo-notifications] addListener',
      'expo-notifications] getPushTokenAsync',
      'push token changes is not yet fully supported on web',
      'addPushTokenListener',
      'TokenEmitter.js',
      'PushTokenManager.js',
      '`expo-notifications` functionality is not fully supported in Expo Go',
      'We recommend you instead use a development build to avoid limitations'
    ];
    
    const shouldSuppress = suppressedWarnings.some(suppressed => 
      message.includes(suppressed)
    );
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };

  console.error = function(...args) {
    const message = args.join(' ');
    
    // Lista de erros específicos do Expo Notifications para suprimir
    const suppressedErrors = [
      'expo-notifications] Listening to push token changes is not yet fully supported on web',
      'addPushTokenListener',
      'TokenEmitter.js',
      'PushTokenManager.js',
      'expo-notifications: Android Push notifications',
      'functionality provided by expo-notifications was removed from Expo Go',
      'Use a development build instead of Expo Go',
      'Read more at https://docs.expo.dev/develop/development-builds/introduction'
    ];
    
    const shouldSuppress = suppressedErrors.some(suppressed => 
      message.includes(suppressed)
    );
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };
  
  // Configuração para melhorar a compatibilidade com notificações web
  if (typeof window !== 'undefined') {
    // Configuração para notificações web
    if ('Notification' in window) {
      // NÃO solicitar permissão automaticamente para evitar violation
      // A permissão deve ser solicitada apenas em resposta a um gesto do usuário
      
      // Disponibilizar função global para solicitar permissão quando necessário
      window.__requestNotificationPermission__ = async () => {
        try {
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission;
          }
          return Notification.permission;
        } catch (error) {
          console.warn('Erro ao solicitar permissão de notificação:', error);
          return 'denied';
        }
      };
      
      // Função para verificar se as notificações estão disponíveis
      window.__checkNotificationSupport__ = () => {
        return 'Notification' in window && 'serviceWorker' in navigator;
      };
    }
  }
}

// Função para verificar se as notificações push estão disponíveis
export const areNotificationsAvailable = () => {
  if (Platform.OS === 'web') {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
  
  // No Expo Go, notificações push não estão disponíveis a partir do SDK 53
  if (isExpoGo) {
    return false;
  }
  
  // Em development builds, notificações estão disponíveis
  return true;
};

// Função para obter uma mensagem explicativa sobre o status das notificações
export const getNotificationStatusMessage = () => {
  if (Platform.OS === 'web') {
    return 'Notificações web disponíveis (limitadas)';
  }
  
  if (isExpoGo) {
    return 'Notificações push não disponíveis no Expo Go. Use um development build para notificações completas.';
  }
  
  return 'Notificações push disponíveis';
};

export default Platform;