// Configuração do console para diferentes ambientes
import { Platform } from 'react-native';

// Configurar console para mobile
if (Platform.OS !== 'web') {
  // Manter console.log em desenvolvimento
  if (__DEV__) {
    // Console já está disponível no React Native
  } else {
    // Em produção, manter apenas erros críticos
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    console.warn = originalWarn;
    console.error = originalError;
  }
}

export {};