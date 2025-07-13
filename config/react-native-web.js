// Configuração específica para React Native Web
import { Platform } from 'react-native';

// Configuração para suprimir avisos específicos do React Native Web
if (Platform.OS === 'web') {
  // Suprimir avisos de depreciação
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Lista de avisos para suprimir
    const suppressedWarnings = [
      'shadow* style props are deprecated',
      'props.pointerEvents is deprecated',
      'Unexpected text node',
      'Layout children must be of type Screen',
      'expo-notifications] Listening to push token changes is not yet fully supported on web'
    ];
    
    const shouldSuppress = suppressedWarnings.some(suppressed => 
      message.includes(suppressed)
    );
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };
  
  // Configuração para melhorar a compatibilidade
  if (typeof window !== 'undefined') {
    // Configuração para touch events
    window.addEventListener('touchstart', () => {}, { passive: true });
    window.addEventListener('touchmove', () => {}, { passive: true });
    window.addEventListener('touchend', () => {}, { passive: true });
    
    // Configuração para melhorar a performance
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignorar erros de service worker
      });
    }
  }
}

export default Platform; 