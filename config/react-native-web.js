// Configuração específica para React Native Web
import { Platform } from 'react-native';

// Configuração para suprimir avisos específicos do React Native Web
if (Platform.OS === 'web') {
  // Suprimir avisos de depreciação de forma mais robusta
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Lista expandida de avisos para suprimir
    const suppressedWarnings = [
      'props.pointerEvents is deprecated',
      'Unexpected text node',
      'Layout children must be of type Screen',
      '"shadow*" style props are deprecated. Use "boxShadow"',
      'shadow*" style props are deprecated',
      'shadowColor',
      'shadowOffset',
      'shadowOpacity',
      'shadowRadius',
      'shadowElevation'
    ];
    
    const shouldSuppress = suppressedWarnings.some(suppressed => 
      message.toLowerCase().includes(suppressed.toLowerCase())
    );
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };

  // Também suprimir erros relacionados a shadow
  console.error = function(...args) {
    const message = args.join(' ');
    
    const suppressedErrors = [
      '"shadow*" style props are deprecated',
      'shadow*" style props are deprecated',
      'shadowColor',
      'shadowOffset',
      'shadowOpacity',
      'shadowRadius'
    ];
    
    const shouldSuppress = suppressedErrors.some(suppressed => 
      message.toLowerCase().includes(suppressed.toLowerCase())
    );
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };
  
  // Configuração para melhorar a compatibilidade
  if (typeof window !== 'undefined') {
    // Configuração para touch events
    window.addEventListener('touchstart', () => {}, { passive: true });
    window.addEventListener('touchmove', () => {}, { passive: true });
    window.addEventListener('touchend', () => {}, { passive: true });
    
    // Suprimir avisos também no window.console
    const originalWindowWarn = window.console.warn;
    const originalWindowError = window.console.error;
    
    window.console.warn = function(...args) {
      const message = args.join(' ');
      const suppressedWarnings = [
        '"shadow*" style props are deprecated',
        'shadow*" style props are deprecated',
        'shadowColor',
        'shadowOffset',
        'shadowOpacity',
        'shadowRadius'
      ];
      
      const shouldSuppress = suppressedWarnings.some(suppressed => 
        message.toLowerCase().includes(suppressed.toLowerCase())
      );
      
      if (!shouldSuppress) {
        originalWindowWarn.apply(window.console, args);
      }
    };

    window.console.error = function(...args) {
      const message = args.join(' ');
      const suppressedErrors = [
        '"shadow*" style props are deprecated',
        'shadow*" style props are deprecated',
        'shadowColor',
        'shadowOffset',
        'shadowOpacity',
        'shadowRadius'
      ];
      
      const shouldSuppress = suppressedErrors.some(suppressed => 
        message.toLowerCase().includes(suppressed.toLowerCase())
      );
      
      if (!shouldSuppress) {
        originalWindowError.apply(window.console, args);
      }
    };
    
    // Configuração para melhorar a performance
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignorar erros de service worker
      });
    }
  }
}

export default Platform;