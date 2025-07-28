import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface ErrorLog {
  timestamp: string;
  error: string;
  context: string;
  platform: string;
  stack?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private isInitialized = false;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Capturar erros JavaScript não tratados
      const originalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
      
      (global as any).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal: boolean) => {
        console.error('[ErrorHandler] Erro global capturado:', error);
        
        this.saveErrorLog(
          error.message || 'Erro desconhecido',
          isFatal ? 'fatal_error' : 'non_fatal_error',
          error.stack
        );

        // Se for um erro fatal, tentar mostrar um alerta antes do crash
        if (isFatal) {
          try {
            Alert.alert(
              'Erro Crítico',
              'O aplicativo encontrou um erro crítico. Os logs foram salvos para análise.',
              [{ text: 'OK' }]
            );
          } catch (alertError) {
            console.error('[ErrorHandler] Erro ao mostrar alerta:', alertError);
          }
        }

        // Chamar o handler original se existir
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });

      // Capturar promises rejeitadas
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('unhandledrejection', (event) => {
          console.error('[ErrorHandler] Promise rejeitada:', event.reason);
          this.saveErrorLog(
            event.reason?.message || String(event.reason),
            'unhandled_promise_rejection',
            event.reason?.stack
          );
        });
      }

      this.isInitialized = true;
      
    } catch (initError) {
      console.error('[ErrorHandler] Erro ao inicializar captura de erros:', initError);
    }
  }

  async saveErrorLog(error: string, context: string, stack?: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry: ErrorLog = {
        timestamp,
        error,
        context,
        platform: require('react-native').Platform.OS,
        stack,
      };
      
      const existingLogs = await AsyncStorage.getItem('errorLogs');
      const logs: ErrorLog[] = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(logEntry);
      
      // Manter apenas os últimos 20 logs
      if (logs.length > 20) {
        logs.splice(0, logs.length - 20);
      }
      
      await AsyncStorage.setItem('errorLogs', JSON.stringify(logs));
      
    } catch (logError) {
      console.error('[ErrorHandler] Erro ao salvar log:', logError);
    }
  }

  async getErrorLogs(): Promise<ErrorLog[]> {
    try {
      const logs = await AsyncStorage.getItem('errorLogs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('[ErrorHandler] Erro ao recuperar logs:', error);
      return [];
    }
  }

  async clearErrorLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem('errorLogs');
      
    } catch (error) {
      console.error('[ErrorHandler] Erro ao limpar logs:', error);
    }
  }

  async getFormattedLogs(): Promise<string> {
    try {
      const logs = await this.getErrorLogs();
      if (logs.length === 0) {
        return 'Nenhum log de erro encontrado';
      }

      return logs.map((log, index) => {
        let formatted = `[${index + 1}] ${log.timestamp}\n`;
        formatted += `Contexto: ${log.context}\n`;
        formatted += `Plataforma: ${log.platform}\n`;
        formatted += `Erro: ${log.error}\n`;
        if (log.stack) {
          formatted += `Stack: ${log.stack.substring(0, 200)}...\n`;
        }
        return formatted;
      }).join('\n' + '='.repeat(50) + '\n');
      
    } catch (error) {
      return `Erro ao formatar logs: ${error}`;
    }
  }
}

export default ErrorHandler;