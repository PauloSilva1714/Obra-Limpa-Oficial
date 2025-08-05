import { db, reconnectFirebase } from '../config/firebase';

export class FirebaseErrorHandler {
  private static retryCount = 0;
  private static maxRetries = 3;
  private static retryDelay = 1000; // 1 segundo

  static async handleError(error: any, operation: string) {
    // Verifica se é um erro de rede
    if (this.isNetworkError(error)) {
      return await this.handleNetworkError(operation);
    }

    // Verifica se é um erro de autenticação
    if (this.isAuthError(error)) {
      return await this.handleAuthError(error, operation);
    }

    // Verifica se é um erro de permissão
    if (this.isPermissionError(error)) {
      return await this.handlePermissionError(error, operation);
    }

    // Erro genérico
    throw new Error(`Erro no Firebase: ${error.message || 'Erro desconhecido'}`);
  }

  private static isNetworkError(error: any): boolean {
    return (
      error.code === 'unavailable' ||
      error.code === 'deadline-exceeded' ||
      error.code === 'resource-exhausted' ||
      error.message?.includes('network') ||
      error.message?.includes('connection') ||
      error.message?.includes('timeout')
    );
  }

  private static isAuthError(error: any): boolean {
    return (
      error.code === 'unauthenticated' ||
      error.code === 'permission-denied' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/invalid-credential'
    );
  }

  private static isPermissionError(error: any): boolean {
    return (
      error.code === 'permission-denied' ||
      error.code === 'auth/insufficient-permission'
    );
  }

  private static async handleNetworkError(operation: string): Promise<any> {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;

      // Aguarda antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));

      // Tenta reconectar
      const reconnected = await reconnectFirebase();
      if (reconnected) {
        this.retryCount = 0; // Reset contador se reconectou
        return true;
      }

      // Se não conseguiu reconectar, tenta novamente
      return await this.handleNetworkError(operation);
    }

    this.retryCount = 0;
    throw new Error(`Falha na conexão após ${this.maxRetries} tentativas`);
  }

  private static async handleAuthError(error: any, operation: string): Promise<any> {
    // Redireciona para login se necessário
    if (typeof window !== 'undefined') {
      // Limpa dados de autenticação locais
      localStorage.removeItem('firebase:authUser:AIzaSyDHJm219NVmB5KdQcLYRgOrp_coC_KbycQ:[DEFAULT]');
      
      // Redireciona para login
      window.location.href = '/login';
    }
    
    throw new Error('Sessão expirada. Por favor, faça login novamente.');
  }

  private static async handlePermissionError(error: any, operation: string): Promise<any> {
    throw new Error('Você não tem permissão para realizar esta operação.');
  }

  // Função para executar operações com retry automático
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return await this.handleError(error, operationName);
    }
  }

  // Função para limpar cache e reconectar
  static async clearCacheAndReconnect(): Promise<boolean> {
    try {
      // Limpa cache do navegador
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Limpa localStorage relacionado ao Firebase
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('firebase') || key.includes('firestore')) {
            localStorage.removeItem(key);
          }
        });
      }

      // Reconecta ao Firebase
      return await reconnectFirebase();
    } catch (error) {
      return false;
    }
  }
} 