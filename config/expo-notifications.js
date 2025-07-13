// Configuração específica para Expo Notifications
import { Platform } from 'react-native';

// Configuração para resolver problemas do Expo Notifications
if (Platform.OS === 'web') {
  // Suprimir avisos específicos do Expo Notifications
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Lista de avisos específicos do Expo Notifications para suprimir
    const suppressedWarnings = [
      'expo-notifications] Listening to push token changes is not yet fully supported on web',
      'expo-notifications',
      'push token changes'
    ];
    
    const shouldSuppress = suppressedWarnings.some(suppressed => 
      message.includes(suppressed)
    );
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };
  
  // Configuração para melhorar a compatibilidade com notificações web
  if (typeof window !== 'undefined') {
    // Configuração para notificações web
    if ('Notification' in window) {
      // Solicitar permissão para notificações
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {
          // Ignorar erros de permissão
        });
      }
    }
  }
}

export default Platform; 