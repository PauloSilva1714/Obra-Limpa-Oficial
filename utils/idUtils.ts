/**
 * Utilitário para geração de IDs únicos compatível com Expo Go
 * Substitui a biblioteca uuid que não funciona no Expo Go devido à dependência do crypto.getRandomValues()
 */

/**
 * Gera um ID único simples baseado em timestamp e números aleatórios
 * Compatível com Expo Go e React Native
 */
export function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);

  return `${timestamp}-${randomPart}-${randomPart2}`;
}

/**
 * Gera um ID único no formato similar ao UUID v4
 * Compatível com Expo Go
 */
export function generateUUIDLike(): string {
  const chars = '0123456789abcdef';
  let result = '';

  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      result += '-';
    }

    if (i === 12) {
      result += '4'; // versão 4
    } else if (i === 16) {
      result += chars[Math.floor(Math.random() * 4) + 8]; // variant bits
    } else {
      result += chars[Math.floor(Math.random() * 16)];
    }
  }

  return result;
}

/**
 * Gera um ID único baseado em timestamp com alta precisão
 * Garante unicidade mesmo em chamadas rápidas consecutivas
 */
let timestampCounter = 0;

export function generateTimestampId(): string {
  const now = Date.now();
  const random = Math.floor(Math.random() * 1000000);

  timestampCounter = (timestampCounter + 1) % 1000;

  return `${now}-${random}-${timestampCounter}`;
}

/**
 * Função principal para gerar IDs únicos
 * Usa o método mais robusto disponível
 */
export function createUniqueId(): string {
  return generateUUIDLike();
}

// Exportação padrão
export default {
  generateUniqueId,
  generateUUIDLike,
  generateTimestampId,
  createUniqueId,
};
