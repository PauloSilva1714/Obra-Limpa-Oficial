/**
 * Utilitários para resolver problemas de touch handling
 * Resolve o aviso: "Cannot record touch end without a touch start"
 */

import { Platform } from 'react-native';

/**
 * Props para TouchableOpacity que previnem conflitos de touch
 */
export const safeTouchProps = {
  activeOpacity: 0.7,
  delayPressIn: 0,
  delayPressOut: 0,
  delayLongPress: 500,
  // Previne conflitos de touch em web
  ...(Platform.OS === 'web' && {
    onTouchStart: undefined,
    onTouchEnd: undefined,
  }),
};

/**
 * Props para ScrollView que previnem conflitos de touch
 */
export const safeScrollProps = {
  // Reduz conflitos com TouchableOpacity aninhados
  scrollEventThrottle: 16,
  // Melhora performance em web
  ...(Platform.OS === 'web' && {
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
  }),
};

/**
 * Props para Modal que previnem conflitos de touch
 */
export const safeModalProps = {
  // Previne conflitos de touch em modais sobrepostos
  supportedOrientations: ['portrait', 'landscape'] as any,
  ...(Platform.OS === 'web' && {
    onTouchStart: undefined,
    onTouchEnd: undefined,
  }),
};

/**
 * Props para FlatList que previnem conflitos de touch e melhoram performance
 */
export const safeFlatListProps = {
  // Melhora performance de renderização
  removeClippedSubviews: Platform.OS !== 'web',
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 10,
  windowSize: 10,
  // Previne conflitos de touch
  scrollEventThrottle: 16,
  // Configurações específicas para web
  ...(Platform.OS === 'web' && {
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
    onTouchStart: undefined,
    onTouchEnd: undefined,
  }),
};

/**
 * Debounce para prevenir múltiplos toques rápidos
 */
export const createDebouncedPress = (callback: () => void, delay: number = 300) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback();
      timeoutId = null;
    }, delay);
  };
};

/**
 * Throttle para limitar frequência de eventos de touch
 */
export const createThrottledPress = (callback: () => void, delay: number = 100) => {
  let lastCall = 0;
  
  return () => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      callback();
    }
  };
};