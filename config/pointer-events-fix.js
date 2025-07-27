// Configuração específica para suprimir avisos de pointerEvents, shadow props e violations
// Este arquivo deve ser carregado ANTES de qualquer outro código

// Interceptar console.warn imediatamente
(function() {
  const originalWarn = console.warn;
  
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Suprimir especificamente avisos de pointerEvents, shadow props, violations, touch events e notifications
    if (message.includes('pointerEvents is deprecated') || 
        message.includes('props.pointerEvents is deprecated') ||
        message.includes('shadow*') ||
        message.includes('boxShadow') ||
        message.includes('Added non-passive event listener') ||
        message.includes('Violation') ||
        message.includes('scroll-blocking') ||
        message.includes('handler took') ||
        message.includes('setTimeout') ||
        message.includes('message') ||
        message.includes('Forced reflow') ||
        message.includes('reflow while executing') ||
        message.includes('Missing or insufficient permissions') ||
        message.includes('FirebaseError') ||
        message.includes('permission-denied') ||
        message.includes('Cannot record touch end without a touch start') ||
        message.includes('Touch End:') ||
        message.includes('Touch Bank:') ||
        message.includes('Only request notification permission in response to a user gesture') ||
        message.includes('notification permission')) {
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
    
    // Suprimir especificamente avisos de pointerEvents, shadow props, violations, touch events e notifications
    if (message.includes('pointerEvents is deprecated') || 
        message.includes('props.pointerEvents is deprecated') ||
        message.includes('shadow*') ||
        message.includes('boxShadow') ||
        message.includes('Added non-passive event listener') ||
        message.includes('Violation') ||
        message.includes('scroll-blocking') ||
        message.includes('handler took') ||
        message.includes('setTimeout') ||
        message.includes('message') ||
        message.includes('Forced reflow') ||
        message.includes('reflow while executing') ||
        message.includes('Missing or insufficient permissions') ||
        message.includes('FirebaseError') ||
        message.includes('permission-denied') ||
        message.includes('Cannot record touch end without a touch start') ||
        message.includes('Touch End:') ||
        message.includes('Touch Bank:') ||
        message.includes('Only request notification permission in response to a user gesture') ||
        message.includes('notification permission')) {
      return; // Não exibir estes avisos
    }
    
    // Chamar o console.warn original para outros avisos
    originalWindowWarn.apply(window.console, args);
  };
}

export default {};