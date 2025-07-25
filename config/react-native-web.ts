// Configuração específica para React Native Web
import { Platform } from 'react-native';

// Configurações específicas para web
if (Platform.OS === 'web') {
  // Polyfills para compatibilidade web
  if (typeof window !== 'undefined') {
    // Configurar viewport para mobile
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
      document.head.appendChild(meta);
    }

    // Prevenir zoom em inputs no iOS Safari
    document.addEventListener('touchstart', () => {}, { passive: true });
    
    // Configurar CSS para melhor compatibilidade mobile
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      
      input, textarea, select {
        -webkit-user-select: text;
        user-select: text;
      }
      
      body {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);
  }
}

export {};