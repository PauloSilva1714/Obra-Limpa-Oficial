// Configuração específica para Expo Router
import { Platform } from 'react-native';

// Configurações para Expo Router
if (Platform.OS === 'web') {
  // Configurar roteamento para web
  if (typeof window !== 'undefined') {
    // Prevenir comportamentos padrão do navegador que podem interferir
    window.addEventListener('beforeunload', (e) => {
      // Permitir navegação normal
      return undefined;
    });

    // Configurar histórico de navegação
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      // Dispatch custom event se necessário
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      // Dispatch custom event se necessário
    };
  }
}

export {};