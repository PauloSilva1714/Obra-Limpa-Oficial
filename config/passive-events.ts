// Configuração para tornar event listeners passivos por padrão
// Isso resolve o aviso: "Added non-passive event listener to a scroll-blocking 'wheel' event"

if (typeof window !== 'undefined') {
  // Sobrescreve addEventListener para tornar eventos de scroll passivos por padrão
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Lista de eventos que devem ser passivos por padrão
    const passiveEvents = ['wheel', 'mousewheel', 'touchstart', 'touchmove'];
    
    if (passiveEvents.includes(type)) {
      if (typeof options === 'boolean') {
        // Se options é um boolean (useCapture), converte para objeto
        options = { capture: options, passive: true };
      } else if (typeof options === 'object' && options !== null) {
        // Se options é um objeto, adiciona passive: true se não estiver definido
        if (!('passive' in options)) {
          options = { ...options, passive: true };
        }
      } else {
        // Se options é undefined ou null, define como { passive: true }
        options = { passive: true };
      }
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };
  
}

export {};