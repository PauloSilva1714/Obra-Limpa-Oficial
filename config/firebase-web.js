// Configuração específica para Firebase Web
import { Platform } from 'react-native';

// Configuração para resolver problemas do Firebase Web
if (Platform.OS === 'web') {
  // Suprimir avisos específicos do Firebase
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Lista de avisos específicos do Firebase para suprimir
    const suppressedWarnings = [
      'BloomFilter error',
      'Firestore',
      'Firebase'
    ];
    
    const shouldSuppress = suppressedWarnings.some(suppressed => 
      message.includes(suppressed)
    );
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };
  
  // Configuração para melhorar a performance do Firebase
  if (typeof window !== 'undefined') {
    // Configuração para melhorar a performance das consultas
    window.addEventListener('beforeunload', () => {
      // Limpar cache do Firebase antes de sair
      if (window.firebase && window.firebase.firestore) {
        try {
          window.firebase.firestore().clearPersistence();
        } catch (error) {
          // Ignorar erros de limpeza
        }
      }
    });
    
  // Configurações para evitar problemas de CORS
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Adicionar headers para evitar problemas de CORS
    const newOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'same-origin'
    };
    
    // Log para debug
      if (url.toString().includes('firestore.googleapis.com')) {
      console.log('🔍 Firebase request:', { url, options: newOptions });
    }
    
    return originalFetch(url, newOptions);
  };
  
  // Configuração adicional para melhorar a conectividade
  if (window.navigator && window.navigator.serviceWorker) {
    // Registrar service worker para melhorar cache
    window.navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(() => console.log('Service Worker registrado'))
      .catch(() => console.log('Service Worker não registrado (esperado)'));
  }
}
}

export default Platform; 