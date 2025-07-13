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
        console.log('🔄 Configurando listeners em tempo real para siteId:', siteId);
        setLoading(true);
        setError(null);

        // Limpar listeners anteriores
        Object.values(unsubscribeRefs.current).forEach(unsubscribe => {
          if (unsubscribe) {
            try {
              unsubscribe();
            } catch (error) {
              console.error('Erro ao limpar listener:', error);
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

        // Configurar listener para tarefas
        const tasksUnsubscribe = await AdminService.subscribeToTasks(siteId, (tasks) => {
          setData(prev => ({ ...prev, tasks, lastUpdate: new Date().toISOString() }));
        });
        unsubscribeRefs.current.tasks = tasksUnsubscribe;

        // Configurar listener para progresso
        const progressUnsubscribe = await AdminService.subscribeToProgress(siteId, (progress) => {
          setData(prev => ({ ...prev, progress, lastUpdate: new Date().toISOString() }));
        });
        unsubscribeRefs.current.progress = progressUnsubscribe;

        // Configurar listener para mensagens
        const messagesUnsubscribe = await AdminService.subscribeToMessages(siteId, (messages) => {
          setData(prev => ({ ...prev, messages, lastUpdate: new Date().toISOString() }));
        });
        unsubscribeRefs.current.messages = messagesUnsubscribe;

        // Configurar listener para notificações
        const notificationsUnsubscribe = await AdminService.subscribeToNotifications((notifications) => {
          setData(prev => ({ ...prev, notifications, lastUpdate: new Date().toISOString() }));
        });
        unsubscribeRefs.current.notifications = notificationsUnsubscribe;

        // Configurar listener para atividades
        const activitiesUnsubscribe = await AdminService.subscribeToAdminActivities(siteId, (activities) => {
          setData(prev => ({ ...prev, activities, lastUpdate: new Date().toISOString() }));
        });
        unsubscribeRefs.current.activities = activitiesUnsubscribe;

        // Configurar listener para convites
        const invitesUnsubscribe = await AdminService.subscribeToInvites(siteId, (invites) => {
          setData(prev => ({ ...prev, invites, lastUpdate: new Date().toISOString() }));
        });
        unsubscribeRefs.current.invites = invitesUnsubscribe;

        // Configurar listener para colaboradores
        const workersUnsubscribe = await AdminService.subscribeToWorkers(siteId, (workers) => {
          setData(prev => ({ ...prev, workers, lastUpdate: new Date().toISOString() }));
        });
        unsubscribeRefs.current.workers = workersUnsubscribe;

        console.log('✅ Todos os listeners configurados com sucesso');
        setLoading(false);

      } catch (error) {
        console.error('❌ Erro ao configurar listeners:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
        setLoading(false);
      }
    };

    setupRealTimeListeners();

    // Cleanup function
    return () => {
      console.log('🧹 Limpando listeners em tempo real');
      Object.values(unsubscribeRefs.current).forEach(unsubscribe => {
        if (unsubscribe) {
          try {
            unsubscribe();
          } catch (error) {
            console.error('Erro ao limpar listener:', error);
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
        AdminService.getMessages(siteId, 50),
        AdminService.getNotifications(20),
        AdminService.getRecentActivities(siteId, 30),
        AuthService.getAdminInvites(siteId),
        AuthService.getSiteAdmins(siteId)
      ]);

      setData(prev => ({
        ...prev,
        tasks,
        messages,
        notifications,
        activities,
        invites,
        workers,
        lastUpdate: new Date().toISOString()
      }));

      setLoading(false);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
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
