/**
 * Utilitários para animações seguras que funcionam tanto em React Native quanto React Native Web
 * Resolve o aviso: "useNativeDriver is not supported because the native animated module is missing"
 */

import { Platform, Animated } from 'react-native';

// Detecta se estamos em uma plataforma que suporta useNativeDriver
const supportsNativeDriver = Platform.OS !== 'web';

// Interfaces para configurações de animação resolvidas
export interface ResolvedAnimationConfig {
  toValue: number;
  duration: number;
  useNativeDriver: boolean;
  delay?: number;
}

export interface ResolvedSpringConfig {
  toValue: number;
  tension?: number;
  friction?: number;
  useNativeDriver: boolean;
  delay?: number;
}

export interface ResolvedDecayConfig {
  velocity: number;
  deceleration?: number;
  useNativeDriver: boolean;
}

// Configurações base para animações
export interface SafeAnimationConfig {
  toValue: number;
  duration: number;
  useNativeDriver?: boolean;
  delay?: number;
}

export interface SafeSpringConfig {
  toValue: number;
  tension?: number;
  friction?: number;
  useNativeDriver?: boolean;
  delay?: number;
}

export interface SafeDecayConfig {
  velocity: number;
  deceleration?: number;
  useNativeDriver?: boolean;
}

/**
 * Cria uma configuração de animação segura
 */
function createSafeAnimationConfig(config: SafeAnimationConfig): ResolvedAnimationConfig {
  return {
    ...config,
    useNativeDriver: config.useNativeDriver !== undefined ? config.useNativeDriver && supportsNativeDriver : supportsNativeDriver,
  };
}

function createSafeSpringConfig(config: SafeSpringConfig): ResolvedSpringConfig {
  return {
    ...config,
    useNativeDriver: config.useNativeDriver !== undefined ? config.useNativeDriver && supportsNativeDriver : supportsNativeDriver,
  };
}

function createSafeDecayConfig(config: SafeDecayConfig): ResolvedDecayConfig {
  return {
    ...config,
    useNativeDriver: config.useNativeDriver !== undefined ? config.useNativeDriver && supportsNativeDriver : supportsNativeDriver,
  };
}

/**
 * Timing animation seguro
 */
export const safeTiming = (
  value: Animated.Value,
  config: SafeAnimationConfig
): Animated.CompositeAnimation => {
  return Animated.timing(value, createSafeAnimationConfig(config));
};

/**
 * Spring animation seguro
 */
export const safeSpring = (
  value: Animated.Value,
  config: SafeSpringConfig
): Animated.CompositeAnimation => {
  return Animated.spring(value, createSafeSpringConfig(config));
};

/**
 * Decay animation seguro
 */
export const safeDecay = (
  value: Animated.Value,
  config: SafeDecayConfig
): Animated.CompositeAnimation => {
  return Animated.decay(value, createSafeDecayConfig(config));
};

/**
 * Animações de fade pré-configuradas
 */
export const fadeAnimations = {
  fadeIn: (value: Animated.Value, duration: number = 300) =>
    safeTiming(value, { toValue: 1, duration }),
  
  fadeOut: (value: Animated.Value, duration: number = 300) =>
    safeTiming(value, { toValue: 0, duration }),
};

/**
 * Animações de slide pré-configuradas
 */
export const slideAnimations = {
  slideInLeft: (value: Animated.Value, duration: number = 300) =>
    safeTiming(value, { toValue: 0, duration }),
  
  slideInRight: (value: Animated.Value, duration: number = 300) =>
    safeTiming(value, { toValue: 0, duration }),
  
  slideOutLeft: (value: Animated.Value, distance: number = -100, duration: number = 300) =>
    safeTiming(value, { toValue: distance, duration }),
  
  slideOutRight: (value: Animated.Value, distance: number = 100, duration: number = 300) =>
    safeTiming(value, { toValue: distance, duration }),
};

/**
 * Animações de scale pré-configuradas
 */
export const scaleAnimations = {
  scaleIn: (value: Animated.Value, duration: number = 300) =>
    safeSpring(value, { toValue: 1, tension: 50, friction: 7 }),
  
  scaleOut: (value: Animated.Value, duration: number = 300) =>
    safeTiming(value, { toValue: 0, duration }),
  
  pulse: (value: Animated.Value) =>
    Animated.sequence([
      safeSpring(value, { toValue: 1.1, tension: 100, friction: 3 }),
      safeSpring(value, { toValue: 1, tension: 100, friction: 3 }),
    ]),
};