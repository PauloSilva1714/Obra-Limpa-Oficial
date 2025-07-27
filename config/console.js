// Configuração do console para suprimir avisos específicos
// IMPORTANTE: Esta configuração deve ser carregada ANTES de qualquer outro código

// Salvar referências originais IMEDIATAMENTE
const originalWarn = console.warn;
const originalError = console.error;

// Lista de avisos para suprimir
const suppressedWarnings = [
  'props.pointerEvents is deprecated',
  'pointerEvents is deprecated',
  'Unexpected text node',
  'Layout children must be of type Screen',
  'expo-notifications] Listening to push token changes is not yet fully supported on web',
  '"shadow*" style props are deprecated. Use "boxShadow"',
  'shadow* style props are deprecated'
];

// Função para verificar se o aviso deve ser suprimido
function shouldSuppressWarning(message) {
  if (typeof message !== 'string') {
    message = String(message);
  }
  return suppressedWarnings.some(suppressed => 
    message.toLowerCase().includes(suppressed.toLowerCase())
  );
}

// Sobrescrever console.warn IMEDIATAMENTE
console.warn = function(...args) {
  const message = args.join(' ');
  if (!shouldSuppressWarning(message)) {
    originalWarn.apply(console, args);
  }
};

// Sobrescrever console.error para alguns casos específicos
console.error = function(...args) {
  const message = args.join(' ');
  if (!shouldSuppressWarning(message)) {
    originalError.apply(console, args);
  }
};

// Configuração para React Native Web
if (typeof window !== 'undefined') {
  // Suprimir avisos específicos do React Native Web
  const originalConsoleWarn = window.console.warn;
  window.console.warn = function(...args) {
    const message = args.join(' ');
    if (!shouldSuppressWarning(message)) {
      originalConsoleWarn.apply(window.console, args);
    }
  };
}

// Configuração do console para desenvolvimento
if (__DEV__) {
  const originalWarn = console.warn;
  const originalError = console.error;

  // Suprimir warnings específicos que não são críticos
  console.warn = (...args) => {
    const message = args[0];
    
    // Suprimir warnings de toque que não são críticos
    if (typeof message === 'string' && (
      message.includes('Cannot record touch end without a touch start') ||
      message.includes('Touch End:') ||
      message.includes('Touch Bank:')
    )) {
      return; // Não exibir esses warnings
    }
    
    // Suprimir warnings de Firebase que são esperados durante desenvolvimento
    if (typeof message === 'string' && (
      message.includes('Firebase connection is OK') ||
      message.includes('Firebase App named') ||
      message.includes('Firebase:')
    )) {
      return; // Não exibir esses warnings
    }
    
    originalWarn.apply(console, args);
  };

  // Suprimir erros específicos que não são críticos
  console.error = (...args) => {
    const message = args[0];
    
    // Suprimir erros de toque que não são críticos
    if (typeof message === 'string' && (
      message.includes('Cannot record touch end without a touch start') ||
      message.includes('Touch End:') ||
      message.includes('Touch Bank:')
    )) {
      return; // Não exibir esses erros
    }
    
    // NÃO suprimir erros de conexão do Firebase - são importantes para debug
    if (typeof message === 'string' && (
      message.includes('Firebase connection check failed') ||
      message.includes('Firebase app não está inicializado') ||
      message.includes('Firestore não está inicializado') ||
      message.includes('Sem conexão com a internet')
    )) {
      originalError.apply(console, args); // Manter esses erros visíveis
      return;
    }
    
    originalError.apply(console, args);
  };

  // Log de inicialização
}

export default console;