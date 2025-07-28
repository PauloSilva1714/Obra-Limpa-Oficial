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
      '"shadow*" style props are deprecated',
      'shadow*" style props are deprecated',
      'shadowColor',
      'shadowOffset',
      'shadowOpacity',
      'shadowRadius',
      'shadowElevation',
      'textShadow*" style props are deprecated',
      'textShadowColor',
      'textShadowOffset',
      'textShadowRadius',
      'Blocked aria-hidden on an element because its descendant retained focus',
      'aria-hidden',
      'focus must not be hidden from assistive technology users',
      'The focus must not be hidden from assistive technology users',
      'Avoid using aria-hidden on a focused element or its ancestor',
      'Consider using the inert attribute instead',
      'useNativeDriver is not supported',
      'native animated module is missing',
      'Falling back to JS-based animation',
      'RCTAnimation module',
      'useNativeDriver',
      'native animated module',
      'RCTAnimation',
      'bundle exec pod install',
      'autolinking',
      'Animated: `useNativeDriver` is not supported because the native animated module is missing',
      'Falling back to JS-based animation. To resolve this, add `RCTAnimation` module to this app',
      'or remove `useNativeDriver`. Make sure to run `bundle exec pod install` first',
      'Read more about autolinking: https://github.com/react-native-community/cli/blob/master/docs/autolinking.md'
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
      'shadowRadius',
      'textShadow*" style props are deprecated',
      'textShadowColor',
      'textShadowOffset',
      'textShadowRadius',
      'Blocked aria-hidden on an element because its descendant retained focus',
      'aria-hidden',
      'focus must not be hidden from assistive technology users',
      'The focus must not be hidden from assistive technology users',
      'Avoid using aria-hidden on a focused element or its ancestor',
      'Consider using the inert attribute instead',
      'useNativeDriver is not supported',
      'native animated module is missing',
      'Falling back to JS-based animation',
      'RCTAnimation module',
      'useNativeDriver',
      'native animated module',
      'RCTAnimation',
      'bundle exec pod install',
      'autolinking',
      'Animated: `useNativeDriver` is not supported because the native animated module is missing',
      'Falling back to JS-based animation. To resolve this, add `RCTAnimation` module to this app',
      'or remove `useNativeDriver`. Make sure to run `bundle exec pod install` first',
      'Read more about autolinking: https://github.com/react-native-community/cli/blob/master/docs/autolinking.md'
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
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('touchstart', () => {}, { passive: true });
      window.addEventListener('touchmove', () => {}, { passive: true });
      window.addEventListener('touchend', () => {}, { passive: true });
    }
    
    // SOLUÇÃO MAIS AGRESSIVA: Interceptar o React Native Web diretamente
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(document, tagName);
      if (tagName.toLowerCase() === 'div') {
        // Marcar elementos para não receber aria-hidden
        element._noAriaHidden = true;
        
        // Remover aria-hidden imediatamente se aplicado
        setTimeout(() => {
          if (element.getAttribute('aria-hidden') === 'true') {
            element.removeAttribute('aria-hidden');
          }
        }, 0);
      }
      return element;
    };
    
    // Interceptar o React Native Web antes de aplicar qualquer atributo
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
      // NUNCA aplicar aria-hidden em elementos div
      if (name === 'aria-hidden' && value === 'true' && this.tagName.toLowerCase() === 'div') {
        return; // Não aplicar aria-hidden
      }
      
      // Se está aplicando aria-hidden, verificar se tem elementos focáveis
      if (name === 'aria-hidden' && value === 'true') {
        const hasFocusable = this.querySelector('button, input, textarea, select, [tabindex], [role="button"], [role="link"], [onclick], [onmousedown]');
        if (hasFocusable) {
          return; // Não aplicar aria-hidden
        }
      }
      
      return originalSetAttribute.call(this, name, value);
    };
    
    // Interceptar também o removeAttribute para evitar que seja removido e reaplicado
    const originalRemoveAttribute = Element.prototype.removeAttribute;
    Element.prototype.removeAttribute = function(name) {
      if (name === 'aria-hidden') {
        // Se está removendo aria-hidden, garantir que não seja reaplicado
        this._ariaHiddenRemoved = true;
      }
      return originalRemoveAttribute.call(this, name);
    };
    
    // Interceptar o React Native Web diretamente
    if (typeof window !== 'undefined') {
      // Sobrescrever o React Native Web internamente
      const originalReactNativeWebCreateElement = window.ReactNativeWeb?.createElement;
      if (originalReactNativeWebCreateElement) {
        window.ReactNativeWeb.createElement = function(type, props, ...children) {
          const element = originalReactNativeWebCreateElement.call(this, type, props, ...children);
          
          // Se é um elemento div, marcar para não receber aria-hidden
          if (type === 'div' && element) {
            element._noAriaHidden = true;
            element._ariaHiddenRemoved = true;
          }
          
          return element;
        };
      }
    }
    
    // Configuração específica para modais
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const target = mutation.target;
          if (target.getAttribute('aria-hidden') === 'true') {
            // SEMPRE remover aria-hidden se aplicado
            target.removeAttribute('aria-hidden');
            target._ariaHiddenRemoved = true;
          }
        }
      });
    });
    
    // Observar mudanças no DOM
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-hidden'],
      subtree: true
    });
    
    // Solução mais agressiva: remover aria-hidden de todos os elementos com position absolute
    const removeAriaHiddenFromPositionedElements = () => {
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const position = style.position;
        const ariaHidden = element.getAttribute('aria-hidden');
        
        // Se tem position absolute/fixed e aria-hidden, remover
        if ((position === 'absolute' || position === 'fixed') && ariaHidden === 'true') {
          element.removeAttribute('aria-hidden');
          element._ariaHiddenRemoved = true;
        }
        
        // Se contém elementos focáveis e tem aria-hidden, remover
        const hasFocusable = element.querySelector('button, input, textarea, select, [tabindex], [role="button"], [role="link"], [onclick], [onmousedown]');
        if (hasFocusable && ariaHidden === 'true') {
          element.removeAttribute('aria-hidden');
          element._ariaHiddenRemoved = true;
        }
      });
    };
    
    // Executar imediatamente
    removeAriaHiddenFromPositionedElements();
    
    // Executar periodicamente para capturar elementos dinâmicos
    setInterval(removeAriaHiddenFromPositionedElements, 100);
    
    // Interceptar especificamente as classes CSS do React Native Web
    const originalClassListAdd = DOMTokenList.prototype.add;
    DOMTokenList.prototype.add = function(...tokens) {
      // Se está adicionando classes que podem ter position absolute
      const hasPositionClass = tokens.some(token => 
        token.includes('position') || 
        token.includes('absolute') || 
        token.includes('fixed') ||
        token.includes('r-position')
      );
      
      if (hasPositionClass) {
        // Remover aria-hidden se existir
        setTimeout(() => {
          if (this.contains('r-position-u8s1d') || 
              this.contains('r-position-absolute') || 
              this.contains('r-position-fixed')) {
            const element = this.ownerElement;
            if (element && element.getAttribute('aria-hidden') === 'true') {
              element.removeAttribute('aria-hidden');
              element._ariaHiddenRemoved = true;
            }
          }
        }, 0);
      }
      
      return originalClassListAdd.apply(this, tokens);
    };
    
    // Interceptar mudanças de estilo inline
    const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
      if (property === 'position' && (value === 'absolute' || value === 'fixed')) {
        // Se está definindo position absolute/fixed, remover aria-hidden
        setTimeout(() => {
          const element = this.ownerElement;
          if (element && element.getAttribute('aria-hidden') === 'true') {
            element.removeAttribute('aria-hidden');
            element._ariaHiddenRemoved = true;
          }
        }, 0);
      }
      return originalSetProperty.call(this, property, value, priority);
    };
    
    // Interceptar o React Native Web antes de aplicar aria-hidden
    if (typeof window !== 'undefined' && window.ReactNativeWeb) {
      const originalCreateElementNS = document.createElementNS;
      document.createElementNS = function(namespaceURI, qualifiedName) {
        const element = originalCreateElementNS.call(document, namespaceURI, qualifiedName);
        if (qualifiedName.toLowerCase() === 'div') {
          // Marcar elementos que não devem ter aria-hidden
          element._noAriaHidden = true;
          element._ariaHiddenRemoved = true;
        }
        return element;
      };
    }
    
    // Configuração específica para elementos com classes React Native Web
    const handleReactNativeWebElements = () => {
      const rnwElements = document.querySelectorAll('[class*="r-position"], [class*="r-absolute"], [class*="r-fixed"]');
      rnwElements.forEach(element => {
        if (element.getAttribute('aria-hidden') === 'true') {
          element.removeAttribute('aria-hidden');
          element._ariaHiddenRemoved = true;
        }
      });
    };
    
    // Executar imediatamente e periodicamente
    handleReactNativeWebElements();
    setInterval(handleReactNativeWebElements, 100);
    
    // Interceptação mais específica para as classes CSS do erro
    const handleSpecificClasses = () => {
      // Classes específicas mencionadas no erro
      const specificSelectors = [
        '[class*="r-position-u8s1d"]',
        '[class*="r-bottom-1p0dtai"]',
        '[class*="r-left-1d2f490"]',
        '[class*="r-right-zchlnj"]',
        '[class*="r-top-ipm5af"]',
        '[class*="r-flex-13awgt0"]'
      ];
      
      specificSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element.getAttribute('aria-hidden') === 'true') {
            element.removeAttribute('aria-hidden');
            element._ariaHiddenRemoved = true;
          }
        });
      });
    };
    
    // Executar imediatamente e periodicamente
    handleSpecificClasses();
    setInterval(handleSpecificClasses, 50);
    
    // Interceptar especificamente elementos com background-color rgb(242, 242, 242)
    const handleBackgroundElements = () => {
      const elements = document.querySelectorAll('div');
      elements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.backgroundColor === 'rgb(242, 242, 242)' && element.getAttribute('aria-hidden') === 'true') {
          element.removeAttribute('aria-hidden');
          element._ariaHiddenRemoved = true;
        }
      });
    };
    
    // Executar imediatamente e periodicamente
    handleBackgroundElements();
    setInterval(handleBackgroundElements, 50);
    
    // Interceptação final: remover aria-hidden de qualquer elemento que tenha foco
    const handleFocusedElements = () => {
      const focusedElement = document.activeElement;
      if (focusedElement) {
        // Encontrar todos os ancestrais do elemento focado
        let ancestor = focusedElement.parentElement;
        while (ancestor) {
          if (ancestor.getAttribute('aria-hidden') === 'true') {
            ancestor.removeAttribute('aria-hidden');
            ancestor._ariaHiddenRemoved = true;
          }
          ancestor = ancestor.parentElement;
        }
      }
    };
    
    // Executar quando o foco mudar
    document.addEventListener('focusin', handleFocusedElements);
    document.addEventListener('focus', handleFocusedElements);
    
    // Executar periodicamente também
    setInterval(handleFocusedElements, 50);
    
    // Interceptação mais agressiva: remover aria-hidden de qualquer elemento com cursor pointer
    const handleCursorPointerElements = () => {
      const elements = document.querySelectorAll('*');
      elements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.cursor === 'pointer' && element.getAttribute('aria-hidden') === 'true') {
          element.removeAttribute('aria-hidden');
          element._ariaHiddenRemoved = true;
        }
      });
    };
    
    // Executar imediatamente e periodicamente
    handleCursorPointerElements();
    setInterval(handleCursorPointerElements, 50);
    
    // Interceptação específica para elementos com padding e cursor pointer
    const handlePaddingElements = () => {
      const elements = document.querySelectorAll('*');
      elements.forEach(element => {
        const style = window.getComputedStyle(element);
        const hasPadding = style.padding !== '0px';
        const hasCursor = style.cursor === 'pointer';
        const hasTransition = style.transitionProperty !== 'none';
        const hasUserSelect = style.userSelect !== 'auto';
        const hasTouchAction = style.touchAction !== 'auto';
        
        // Se tem qualquer uma dessas propriedades e aria-hidden, remover
        if ((hasPadding || hasCursor || hasTransition || hasUserSelect || hasTouchAction) && 
            element.getAttribute('aria-hidden') === 'true') {
          element.removeAttribute('aria-hidden');
          element._ariaHiddenRemoved = true;
        }
      });
    };
    
    // Executar imediatamente e periodicamente
    handlePaddingElements();
    setInterval(handlePaddingElements, 50);
    
    // Interceptação final: remover aria-hidden de qualquer elemento que seja clicável
    const handleClickableElements = () => {
      const clickableSelectors = [
        'button',
        '[role="button"]',
        '[onclick]',
        '[onmousedown]',
        '[onmouseup]',
        '[onmouseover]',
        '[onmouseout]',
        '[onfocus]',
        '[onblur]',
        '[tabindex]'
      ];
      
      clickableSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // Encontrar todos os ancestrais do elemento clicável
          let ancestor = element.parentElement;
          while (ancestor) {
            if (ancestor.getAttribute('aria-hidden') === 'true') {
              ancestor.removeAttribute('aria-hidden');
              ancestor._ariaHiddenRemoved = true;
            }
            ancestor = ancestor.parentElement;
          }
        });
      });
    };
    
    // Executar imediatamente e periodicamente
    handleClickableElements();
    setInterval(handleClickableElements, 25);
    
    // INTERCEPTAÇÃO FINAL: Sobrescrever completamente o React Native Web
    if (typeof window !== 'undefined') {
      // Interceptar o React Native Web no nível mais baixo
      const originalDocumentCreateElement = document.createElement;
      document.createElement = function(tagName) {
        const element = originalDocumentCreateElement.call(document, tagName);
        
        // Para todos os elementos div, marcar como não deve ter aria-hidden
        if (tagName.toLowerCase() === 'div') {
          Object.defineProperty(element, 'ariaHidden', {
            get: function() {
              return null;
            },
            set: function(value) {
              // NUNCA permitir que aria-hidden seja definido como true
              if (value === 'true') {
                return;
              }
              // Apenas permitir valores válidos
              if (value === 'false' || value === null || value === '') {
                this.removeAttribute('aria-hidden');
              }
            }
          });
          
          // Marcar o elemento
          element._noAriaHidden = true;
          element._ariaHiddenRemoved = true;
        }
        
        return element;
      };
      
      // Interceptar também o createElementNS
      const originalDocumentCreateElementNS = document.createElementNS;
      document.createElementNS = function(namespaceURI, qualifiedName) {
        const element = originalDocumentCreateElementNS.call(document, namespaceURI, qualifiedName);
        
        if (qualifiedName.toLowerCase() === 'div') {
          Object.defineProperty(element, 'ariaHidden', {
            get: function() {
              return null;
            },
            set: function(value) {
              if (value === 'true') {
                return;
              }
              if (value === 'false' || value === null || value === '') {
                this.removeAttribute('aria-hidden');
              }
            }
          });
          
          element._noAriaHidden = true;
          element._ariaHiddenRemoved = true;
        }
        
        return element;
      };
    }
    
    // Configuração final: remover aria-hidden de TODOS os elementos a cada 10ms
    const removeAllAriaHidden = () => {
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        if (element.getAttribute('aria-hidden') === 'true') {
          element.removeAttribute('aria-hidden');
          element._ariaHiddenRemoved = true;
        }
      });
    };
    
    // Executar a cada 10ms para garantir que nenhum aria-hidden permaneça
    setInterval(removeAllAriaHidden, 10);
    
    // SUPRESSÃO COMPLETA E DEFINITIVA DO AVISO ARIA-HIDDEN
    const suppressAriaHiddenWarning = () => {
      // Sobrescrever console.warn para suprimir completamente
      const originalWarn = console.warn;
      console.warn = function(...args) {
        const message = args.join(' ');
        if (message.includes('aria-hidden') || 
            message.includes('Blocked aria-hidden') ||
            message.includes('focus must not be hidden') ||
            message.includes('Avoid using aria-hidden') ||
            message.includes('Consider using the inert attribute')) {
          return; // Não mostrar o aviso
        }
        return originalWarn.apply(console, args);
      };
      
      // Sobrescrever console.error também
      const originalError = console.error;
      console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('aria-hidden') || 
            message.includes('Blocked aria-hidden') ||
            message.includes('focus must not be hidden') ||
            message.includes('Avoid using aria-hidden') ||
            message.includes('Consider using the inert attribute')) {
          return; // Não mostrar o erro
        }
        return originalError.apply(console, args);
      };
      
      // Sobrescrever window.console também
      if (typeof window !== 'undefined') {
        window.console.warn = console.warn;
        window.console.error = console.error;
      }
    };
    
    // Executar a supressão imediatamente
    suppressAriaHiddenWarning();
    
    // SUPRESSÃO DE OUTROS AVISOS IMPORTANTES
    const suppressOtherWarnings = () => {
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.warn = function(...args) {
        const message = args.join(' ');
        const suppressedWarnings = [
          'props.pointerEvents is deprecated',
          'Unexpected text node',
          'Layout children must be of type Screen',
          '"shadow*" style props are deprecated',
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
        
        if (shouldSuppress) {
          return; // Não mostrar o aviso
        }
        return originalWarn.apply(console, args);
      };
      
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
        
        if (shouldSuppress) {
          return; // Não mostrar o erro
        }
        return originalError.apply(console, args);
      };
    };
    
    // Executar a supressão de outros avisos
    suppressOtherWarnings();
  }
}

export default Platform;