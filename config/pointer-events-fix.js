// Configuração específica para suprimir avisos de pointerEvents, shadow props e violations
// Este arquivo deve ser carregado ANTES de qualquer outro código

// Interceptar console.warn imediatamente
(function() {
  const originalWarn = console.warn;
  
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Suprimir especificamente avisos de pointerEvents, shadow props e violations
    if (message.includes('pointerEvents is deprecated') || 
        message.includes('props.pointerEvents is deprecated') ||
        message.includes('shadow*') ||
        message.includes('boxShadow') ||
        message.includes('Added non-passive event listener') ||
        message.includes('Violation') ||
        message.includes('scroll-blocking') ||
        message.includes('handler took') ||
        message.includes('setTimeout') ||
        message.includes('message')) {
      return; // Não exibir estes avisos
    }
    
    // Chamar o console.warn original para outros avisos
    originalWarn.apply(console, args);
  };
})();

// Para React Native Web
if (typeof window !== 'undefined') {
  const originalWindowWarn = window.console.warn;
  
  window.console.warn = function(...args) {
    const message = args.join(' ');
    
    // Suprimir especificamente avisos de pointerEvents, shadow props e violations
    if (message.includes('pointerEvents is deprecated') || 
        message.includes('props.pointerEvents is deprecated') ||
        message.includes('shadow*') ||
        message.includes('boxShadow') ||
        message.includes('Added non-passive event listener') ||
        message.includes('Violation') ||
        message.includes('scroll-blocking') ||
        message.includes('handler took') ||
        message.includes('setTimeout') ||
        message.includes('message')) {
      return; // Não exibir estes avisos
    }
    
    // Chamar o console.warn original para outros avisos
    originalWindowWarn.apply(window.console, args);
  };
}

export default {};