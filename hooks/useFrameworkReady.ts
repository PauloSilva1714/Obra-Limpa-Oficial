import { useState, useEffect, useRef } from 'react';
import { AdminService } from '../services/AdminService';
import { AuthService } from '../services/AuthService';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    window.frameworkReady?.();
  });
}

export interface RealTimeData {
  tasks: any[];
  progress: any;
  messages: any[];
  notifications: any[];
  activities: any[];
  invites: any[];
  workers: any[];
  lastUpdate: string;
}

export const useAdminRealTimeSync = (siteId: string) => {
  const [data, setData] = useState<RealTimeData>({
    tasks: [],
    progress: { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, pendingTasks: 0, completionRate: 0 },
    messages: [],
    notifications: [],
    activities: [],
    invites: [],
    workers: [],
    lastUpdate: new Date().toISOString()
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs para armazenar as funções de unsubscribe
  const unsubscribeRefs = useRef<{
    tasks: (() => void) | null;
    progress: (() => void) | null;
    messages: (() => void) | null;
    notifications: (() => void) | null;
    activities: (() => void) | null;
    invites: (() => void) | null;
    workers: (() => void) | null;
  }>({
    tasks: null,
    progress: null,
    messages: null,
    notifications: null,
    activities: null,
    invites: null,
    workers: null
  });

  useEffect(() => {
    if (!siteId) {
      setError('ID da obra não fornecido');
      setLoading(false);
      return;
    }

    const setupRealTimeListeners = async () => {
      try {
        setLoading(true);
        setError(null);

        // Limpar listeners anteriores
        Object.values(unsubscribeRefs.current).forEach(unsubscribe => {
          if (unsubscribe) {
            try {
              unsubscribe();
            } catch (error) {
              }
          }
        });

        // Reset refs
        unsubscribeRefs.current = {
          tasks: null,
          progress: null,
          messages: null,
          notifications: null,
          activities: null,
          invites: null,
          workers: null
        };

        // Configurar listeners com timeout e retry
        const setupListenerWithTimeout = async (
          setupFunction: () => Promise<() => void>,
          name: string,
          timeout: number = 10000
        ) => {
          try {
            const timeoutPromise = new Promise<() => void>((_, reject) => {
              setTimeout(() => reject(new Error(`Timeout ao configurar ${name}`)), timeout);
            });
            
            return await Promise.race([setupFunction(), timeoutPromise]);
          } catch (error) {
            return () => {}; // Retorna função vazia em caso de erro
          }
        };

        // Configurar listener para tarefas com timeout
        const tasksUnsubscribe = await setupListenerWithTimeout(
          () => AdminService.subscribeToTasks(siteId, (tasks) => {
            setData(prev => ({ ...prev, tasks, lastUpdate: new Date().toISOString() }));
          }),
          'tarefas'
        );
        unsubscribeRefs.current.tasks = tasksUnsubscribe;

        // Configurar listener para progresso com timeout
        const progressUnsubscribe = await setupListenerWithTimeout(
          () => AdminService.subscribeToProgress(siteId, (progress) => {
            setData(prev => ({ ...prev, progress, lastUpdate: new Date().toISOString() }));
          }),
          'progresso'
        );
        unsubscribeRefs.current.progress = progressUnsubscribe;

        // Configurar listener para mensagens com timeout
        const messagesUnsubscribe = await setupListenerWithTimeout(
          () => AdminService.subscribeToMessages(siteId, (messages) => {
            setData(prev => ({ ...prev, messages, lastUpdate: new Date().toISOString() }));
          }),
          'mensagens'
        );
        unsubscribeRefs.current.messages = messagesUnsubscribe;

        // Configurar listener para notificações com timeout
        const notificationsUnsubscribe = await setupListenerWithTimeout(
          () => AdminService.subscribeToNotifications((notifications) => {
            setData(prev => ({ ...prev, notifications, lastUpdate: new Date().toISOString() }));
          }),
          'notificações'
        );
        unsubscribeRefs.current.notifications = notificationsUnsubscribe;

        // Configurar listener para atividades com timeout
        const activitiesUnsubscribe = await setupListenerWithTimeout(
          () => AdminService.subscribeToAdminActivities(siteId, (activities) => {
            setData(prev => ({ ...prev, activities, lastUpdate: new Date().toISOString() }));
          }),
          'atividades'
        );
        unsubscribeRefs.current.activities = activitiesUnsubscribe;

        // Configurar listener para convites com timeout
        const invitesUnsubscribe = await setupListenerWithTimeout(
          () => AdminService.subscribeToInvites(siteId, (invites) => {
            setData(prev => ({ ...prev, invites, lastUpdate: new Date().toISOString() }));
          }),
          'convites'
        );
        unsubscribeRefs.current.invites = invitesUnsubscribe;

        // Configurar listener para colaboradores com timeout
        const workersUnsubscribe = await setupListenerWithTimeout(
          () => AdminService.subscribeToWorkers(siteId, (workers) => {
            setData(prev => ({ ...prev, workers, lastUpdate: new Date().toISOString() }));
          }),
          'colaboradores'
        );
        unsubscribeRefs.current.workers = workersUnsubscribe;

        setLoading(false);

      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
        setLoading(false);
      }
    };

    // Aguardar um pouco antes de configurar os listeners para evitar sobrecarga na inicialização
    const timer = setTimeout(() => {
      setupRealTimeListeners();
    }, 1000);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      Object.values(unsubscribeRefs.current).forEach(unsubscribe => {
        if (unsubscribe) {
          try {
            unsubscribe();
          } catch (error) {
            }
        }
      });
    };
  }, [siteId]);

  // Função para forçar atualização manual
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Recarregar dados iniciais
      const [tasks, messages, notifications, activities, invites, workers] = await Promise.all([
        AdminService.getMessages(siteId, {}),
        AdminService.getNotifications(20),
        AdminService.getRecentActivities(siteId, 30),
        AuthService.getAdminInvites(siteId),
        AuthService.getSiteAdmins(siteId),
        AdminService.getWorkers(siteId) // add
      ]);

      setData(prev => ({
        ...prev,
        tasks,
        messages,
        notifications,
        activities,
        invites,
        workers: workers || [], // Garante que workers seja um array, mesmo que seja vazio
        lastUpdate: new Date().toISOString()
      }));

      setLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar dados');
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refreshData,
    isConnected: !loading && !error
  };
};
