// Configuração específica para Expo Router
import { Platform } from 'react-native';

// Configuração para resolver problemas do Expo Router
if (Platform.OS === 'web') {
  // Suprimir avisos específicos do Expo Router
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Lista de avisos específicos do Expo Router para suprimir
    const suppressedWarnings = [
      'Layout children must be of type Screen',
      'all other children are ignored',
      'Update Layout Route at'
    ];
    
    const shouldSuppress = suppressedWarnings.some(suppressed => 
      message.includes(suppressed)
    );
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };
  
  // Configuração para melhorar a navegação
  if (typeof window !== 'undefined') {
    // Configuração para melhorar a performance da navegação
    window.addEventListener('popstate', () => {
      // Forçar re-render quando necessário
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });
  }
}

export default Platform; 