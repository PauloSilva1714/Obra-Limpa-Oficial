import { Platform, ViewStyle } from 'react-native';

/**
 * Utilitário para criar sombras consistentes entre plataformas
 * usando apenas boxShadow para evitar avisos de propriedades shadow depreciadas
 */

export interface ShadowConfig {
  elevation?: number;
  color?: string;
  offset?: { width: number; height: number };
  opacity?: number;
  radius?: number;
}

/**
 * Cria um estilo de sombra otimizado para cada plataforma
 * @param config Configuração da sombra
 * @returns Estilo de sombra apropriado para a plataforma
 */
export function createShadow(config: ShadowConfig): ViewStyle {
  const {
    elevation = 4,
    color = '#000',
    offset = { width: 0, height: 2 },
    opacity = 0.1,
    radius = 4
  } = config;

  // Para todas as plataformas, usar apenas boxShadow para evitar avisos
  const offsetX = offset.width;
  const offsetY = offset.height;
  const blur = radius;
  const alpha = opacity;
  
  // Converter cor hex para rgba se necessário
  let shadowColor = color;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return {
    boxShadow: `${offsetX}px ${offsetY}px ${blur}px ${shadowColor}`,
    elevation: Platform.OS === 'android' ? elevation : undefined,
  } as ViewStyle;
}

/**
 * Sombras pré-definidas para uso comum
 * Usando apenas boxShadow para evitar avisos de propriedades shadow depreciadas
 */
export const shadows = {
  small: {
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: Platform.OS === 'android' ? 2 : undefined,
  } as ViewStyle,
  
  medium: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: Platform.OS === 'android' ? 4 : undefined,
  } as ViewStyle,
  
  large: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: Platform.OS === 'android' ? 8 : undefined,
  } as ViewStyle,
  
  card: {
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: Platform.OS === 'android' ? 3 : undefined,
  } as ViewStyle,
  
  modal: {
    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.2)',
    elevation: Platform.OS === 'android' ? 12 : undefined,
  } as ViewStyle,
};