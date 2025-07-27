// Configuração específica para Expo Notifications
import { Platform } from 'react-native';

// Configuração para resolver problemas do Expo Notifications
if (Platform.OS === 'web') {
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
      'PushTokenManager.js'
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
      'PushTokenManager.js'
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

export default Platform;