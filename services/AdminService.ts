import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  setDoc,
  writeBatch,
  FieldValue,
  DocumentData
} from 'firebase/firestore';
import { AuthService, User, Site } from './AuthService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export interface AdminMessage {
  id: string;
  siteId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  type: 'general' | 'task' | 'alert' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string | Timestamp | FieldValue;
  updatedAt?: string;
  readBy: string[];
  attachments?: string[];
  recipientId?: string;
  isPrivate?: boolean;
}

export interface AdminNotification {
  id: string;
  siteId: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  type: 'message' | 'task_assigned' | 'task_completed' | 'invite' | 'alert';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface AdminActivity {
  id: string;
  siteId: string;
  adminId: string;
  adminName: string;
  action:
    | 'login'
    | 'logout'
    | 'task_created'
    | 'task_updated'
    | 'worker_invited'
    | 'admin_invited'
    | 'site_updated';
  details: string;
  timestamp: string;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  phone?: string;
  company?: string;
  siteId?: string;
}

export interface AdminDirectMessage {
  id: string;
  siteId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  createdAt: string | Timestamp | FieldValue;
  updatedAt?: string;
  readBy: string[];
  attachments?: string[];
  readAt?: string | Timestamp;
  clientId?: string;
}

export interface AdminChatSession {
  id: string;
  siteId: string;
  participants: string[];
  participantNames: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export class AdminService {
  /**
   * Envia uma mensagem para outros administradores da mesma obra
   */
  static async sendMessage(
    siteId: string,
    message: string,
    type: AdminMessage['type'] = 'general',
    priority: AdminMessage['priority'] = 'medium'
  ): Promise<AdminMessage> {
    try {
      if (!siteId) {
        throw new Error('ID da obra é obrigatório');
      }

      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Apenas administradores podem enviar mensagens');
      }

      if (!currentUser.sites?.includes(siteId)) {
        throw new Error('Você não tem acesso a esta obra');
      }

      const messageData: Omit<AdminMessage, 'id'> = {
        siteId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        message,
        type,
        priority,
        createdAt: serverTimestamp(), // CORRIGIDO
        readBy: [currentUser.id], // O remetente já leu
      };

      const docRef = await addDoc(collection(db, 'adminMessages'), messageData);

      // Enviar notificações para outros administradores
      await this.notifyOtherAdmins(
        siteId,
        currentUser.id,
        'message',
        'Nova mensagem de administrador',
        message
      );

      return {
        id: docRef.id,
        ...messageData,
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Busca mensagens da obra atual (mensagens gerais)
   */
  static async getMessages(
    siteId: string,
    options?: { limitCount?: number }
  ): Promise<AdminMessage[]> {
    const limitCount = options?.limitCount ?? 50;
    try {
      if (!siteId) {
        console.warn(
          '❌ AdminService.getMessages() - siteId é undefined, retornando array vazio'
        );
        return [];
      }

      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser || currentUser.role !== 'admin') {
        console.warn(
          '❌ AdminService.getMessages() - Usuário não é admin, retornando array vazio'
        );
        return [];
      }

      if (!currentUser.sites?.includes(siteId)) {
        console.warn(
          '❌ AdminService.getMessages() - Usuário não tem acesso ao site:',
          siteId
        );
        return [];
      }

      const q = query(
        collection(db, 'adminMessages'),
        where('siteId', '==', siteId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);

      const messages = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AdminMessage)
      );

      return messages;
    } catch (error) {
      console.error(
        '❌ AdminService.getMessages() - Erro ao buscar mensagens:',
        error
      );
      console.error(
        '❌ AdminService.getMessages() - Stack trace:',
        error instanceof Error ? error.stack : 'N/A'
      );
      return [];
    }
  }

  /**
   * Marca uma mensagem como lida
   */
  static async markMessageAsRead(
    messageId: string,
    options?: { userId?: string; collection?: 'adminMessages' | 'adminDirectMessages' }
  ): Promise<void> {
    try {
      const collectionName = options?.collection || 'adminMessages';
      let userId = options?.userId;
      if (!userId) {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return;
        userId = currentUser.id;
      }
      const messageRef = doc(db, collectionName, messageId);
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) return;
      const data = messageDoc.data();
      const readBy = data.readBy || [];
      if (!readBy.includes(userId)) {
        const updateData: any = {
          readBy: [...readBy, userId],
        };
        if (collectionName === 'adminMessages') {
          updateData.updatedAt = new Date().toISOString();
        } else if (collectionName === 'adminDirectMessages') {
          updateData.readAt = serverTimestamp();
        }
        await updateDoc(messageRef, updateData);
      }
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
      throw error;
    }
  }

  /**
   * Busca notificações do administrador atual
   */
  static async getNotifications(
    limitCount: number = 20
  ): Promise<AdminNotification[]> {
    try {
      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser) {
        console.warn(
          '❌ AdminService.getNotifications() - Usuário não autenticado, retornando array vazio'
        );
        return [];
      }

      if (currentUser.role !== 'admin') {
        console.warn(
          '❌ AdminService.getNotifications() - Usuário não é admin, retornando array vazio'
        );
        return [];
      }

      const q = query(
        collection(db, 'adminNotifications'),
        where('recipientId', '==', currentUser.id),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);

      const notifications = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AdminNotification)
      );

      return notifications;
    } catch (error: any) {
      // Verificar se é erro de permissão específico
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        console.warn(
          '⚠️ AdminService.getNotifications() - Permissões insuficientes para acessar notificações. Verifique as regras do Firestore.'
        );
        return [];
      }

      console.error(
        '❌ AdminService.getNotifications() - Erro ao buscar notificações:',
        error
      );
      console.error(
        '❌ AdminService.getNotifications() - Stack trace:',
        error instanceof Error ? error.stack : 'N/A'
      );
      return [];
    }
  }

  /**
   * Marca uma notificação como lida
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'adminNotifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }

  /**
   * Busca atividades recentes da obra
   */
  static async getRecentActivities(
    siteId: string,
    limitCount: number = 30
  ): Promise<AdminActivity[]> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return [];
      }

      if (!currentUser.sites?.includes(siteId)) {
        return [];
      }

      const q = query(
        collection(db, 'adminActivities'),
        where('siteId', '==', siteId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AdminActivity)
      );
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      return [];
    }
  }

  /**
   * Registra uma atividade de administrador
   */
  static async logActivity(
    siteId: string,
    action: AdminActivity['action'],
    details: string
  ): Promise<void> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') return;

      const activityData: Omit<AdminActivity, 'id'> = {
        siteId,
        adminId: currentUser.id,
        adminName: currentUser.name,
        action,
        details,
        timestamp: new Date().toISOString(),
      };

      await addDoc(collection(db, 'adminActivities'), activityData);
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
    }
  }

  /**
   * Busca outros administradores da mesma obra
   */
  static async getOtherAdmins(siteId: string): Promise<User[]> {
    try {
      console.log('[AdminService] getOtherAdmins - Buscando administradores para siteId:', siteId);
      if (!siteId) {
        console.warn('[AdminService] getOtherAdmins - siteId é undefined, retornando array vazio');
        return [];
      }

      const currentUser = await AuthService.getCurrentUser();
      console.log('[AdminService] getOtherAdmins - Usuário atual:', currentUser?.id, currentUser?.name);
      if (!currentUser) return [];

      const admins = await AuthService.getSiteAdmins(siteId);
      console.log('[AdminService] getOtherAdmins - Todos os administradores:', admins.length, admins);
      const filteredAdmins = admins.filter((admin) => admin.id !== currentUser.id);
      console.log('[AdminService] getOtherAdmins - Administradores filtrados:', filteredAdmins.length, filteredAdmins);
      return filteredAdmins;
    } catch (error) {
      console.error('[AdminService] getOtherAdmins - Erro ao buscar outros administradores:', error);
      return [];
    }
  }

  /**
   * Envia notificação para outros administradores
   */
  private static async notifyOtherAdmins(
    siteId: string,
    senderId: string,
    type: AdminNotification['type'],
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    try {
      if (!siteId) {
        console.warn('siteId é undefined, não é possível enviar notificações');
        return;
      }

      const otherAdmins = await this.getOtherAdmins(siteId);

      const currentUser = await AuthService.getCurrentUser();
      const senderName = currentUser?.name || 'Administrador';

      const notifications = otherAdmins.map((admin) => ({
        siteId,
        recipientId: admin.id,
        senderId,
        senderName,
        type,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl,
      }));

      // Adicionar notificações em lote
      const batch = notifications.map((notification) =>
        addDoc(collection(db, 'adminNotifications'), notification)
      );

      await Promise.all(batch);
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
    }
  }

  /**
   * Configura listener em tempo real para mensagens
   */
  static async subscribeToMessages(
    siteId: string,
    callback: (messages: AdminMessage[]) => void
  ) {
    try {

      if (!siteId) {
        console.warn(
          '❌ AdminService.subscribeToMessages - siteId é undefined, retornando função vazia'
        );
        return () => {};
      }

      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser || currentUser.role !== 'admin') {
        console.warn(
          '❌ AdminService.subscribeToMessages - Usuário não é admin, retornando função vazia'
        );
        return () => {};
      }

      if (!currentUser.sites?.includes(siteId)) {
        console.warn(
          '❌ AdminService.subscribeToMessages - Usuário não tem acesso ao site:',
          siteId
        );
        return () => {};
      }

      const q = query(
        collection(db, 'adminMessages'),
        where('siteId', '==', siteId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const messages = querySnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as AdminMessage)
          );

          callback(messages);
        },
        (error) => {
          console.error(
            '❌ AdminService.subscribeToMessages - Erro no listener:',
            error
          );
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error(
        '❌ AdminService.subscribeToMessages - Erro ao configurar listener:',
        error
      );
      return () => {};
    }
  }

  /**
   * Configura listener em tempo real para notificações
   */
  static async subscribeToNotifications(
    callback: (notifications: AdminNotification[]) => void
  ) {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) return () => {};

    const q = query(
      collection(db, 'adminNotifications'),
      where('recipientId', '==', currentUser.id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AdminNotification)
      );
      callback(notifications);
    });
  }

  /**
   * Deleta uma mensagem (apenas o remetente pode deletar)
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar mensagens');
      }

      const messageRef = doc(db, 'adminMessages', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Mensagem não encontrada');
      }

      const message = messageDoc.data() as AdminMessage;
      if (message.senderId !== currentUser.id) {
        throw new Error('Apenas o remetente pode deletar a mensagem');
      }

      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de comunicação da obra
   */
  static async getCommunicationStats(siteId: string): Promise<{
    totalMessages: number;
    unreadMessages: number;
    totalNotifications: number;
    unreadNotifications: number;
    activeAdmins: number;
  }> {
    try {
      if (!siteId) {
        console.warn('siteId é undefined, retornando estatísticas vazias');
        return {
          totalMessages: 0,
          unreadMessages: 0,
          totalNotifications: 0,
          unreadNotifications: 0,
          activeAdmins: 0,
        };
      }

      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return {
          totalMessages: 0,
          unreadMessages: 0,
          totalNotifications: 0,
          unreadNotifications: 0,
          activeAdmins: 0,
        };
      }

      // Buscar mensagens
      const messagesQuery = query(
        collection(db, 'adminMessages'),
        where('siteId', '==', siteId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(
        (doc) => doc.data() as AdminMessage
      );

      const unreadMessages = messages.filter(
        (msg) => !msg.readBy.includes(currentUser.id)
      ).length;

      // Buscar notificações
      const notificationsQuery = query(
        collection(db, 'adminNotifications'),
        where('recipientId', '==', currentUser.id)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notifications = notificationsSnapshot.docs.map(
        (doc) => doc.data() as AdminNotification
      );

      const unreadNotifications = notifications.filter(
        (notif) => !notif.read
      ).length;

      // Buscar administradores ativos
      const admins = await this.getOtherAdmins(siteId);

      return {
        totalMessages: messages.length,
        unreadMessages,
        totalNotifications: notifications.length,
        unreadNotifications,
        activeAdmins: admins.length + 1, // +1 para incluir o usuário atual
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        totalMessages: 0,
        unreadMessages: 0,
        totalNotifications: 0,
        unreadNotifications: 0,
        activeAdmins: 0,
      };
    }
  }

  /**
   * Função de debug para verificar comunicação entre administradores
   */
  static async debugAdminCommunication(siteId: string): Promise<{
    success: boolean;
    currentUser: any;
    siteAdmins: any[];
    messages: any[];
    error?: string;
  }> {
    try {

      // Verificar usuário atual
      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser) {
        return {
          success: false,
          currentUser: null,
          siteAdmins: [],
          messages: [],
          error: 'Usuário não autenticado',
        };
      }

      if (currentUser.role !== 'admin') {
        return {
          success: false,
          currentUser,
          siteAdmins: [],
          messages: [],
          error: 'Usuário não é administrador',
        };
      }

      // Verificar se o usuário tem acesso ao site

      if (!currentUser.sites?.includes(siteId)) {
        return {
          success: false,
          currentUser,
          siteAdmins: [],
          messages: [],
          error: `Usuário não tem acesso ao site ${siteId}. Sites disponíveis: ${
            currentUser.sites?.join(', ') || 'nenhum'
          }`,
        };
      }

      // Buscar outros administradores do site
      const siteAdmins = await this.getOtherAdmins(siteId);

      // Buscar mensagens do site
      const messages = await this.getMessages(siteId);

      // Verificar site atual
      const currentSite = await AuthService.getCurrentSite();

      const result = {
        success: true,
        currentUser: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          sites: currentUser.sites,
          siteId: currentUser.siteId,
        },
        siteAdmins: siteAdmins.map((admin) => ({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        })),
        messages: messages.map((msg) => ({
          id: msg.id,
          senderName: msg.senderName,
          message: msg.message,
          createdAt: msg.createdAt,
          type: msg.type,
          priority: msg.priority,
        })),
        currentSite: currentSite
          ? {
              id: currentSite.id,
              name: currentSite.name,
              address: currentSite.address,
            }
          : null,
      };

      return result;
    } catch (error) {
      console.error('❌ Erro no debug de comunicação:', error);
      return {
        success: false,
        currentUser: null,
        siteAdmins: [],
        messages: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Método legado para compatibilidade - Estatísticas gerais
   */
  static async getAdminStats() {
    try {
      // Buscar apenas as obras do usuário logado
      const userSites = await AuthService.getUserSites();
      const totalSites = userSites.length;

      // Buscar colaboradores ativos de todas as obras do usuário logado
      let workers: User[] = [];
      for (const site of userSites) {
        const siteWorkers = await AuthService.getWorkersBySite(site.id);
        const siteAdmins = await AuthService.getAdminsBySite(site.id);
        workers = workers.concat(siteWorkers, siteAdmins);
      }
      // Remover duplicados (caso algum worker/admin esteja em mais de uma obra)
      const uniqueWorkers = Array.from(
        new Map(workers.map((w) => [w.id, w])).values()
      );
      const activeWorkers = uniqueWorkers.filter((w) => w.status === 'active');

      // Buscar tarefas do site atual
      const currentSite = await AuthService.getCurrentSite();
      console.log('[AdminService] Obra atual para estatísticas:', currentSite?.name || 'Nenhuma');
      
      if (!currentSite) {
        console.log('[AdminService] Nenhuma obra selecionada, retornando estatísticas básicas');
        return {
          totalSites,
          totalWorkers: activeWorkers.length,
          totalTasks: 0,
          completedTasks: 0,
        };
      }
      
      console.log('[AdminService] Buscando tarefas para obra:', currentSite.id);
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', currentSite.id)
      );
      const tasksSnapshot = await getDocs(tasksQuery);

      const completedTasksQuery = query(
        collection(db, 'tasks'),
        where('siteId', '==', currentSite.id),
        where('status', '==', 'completed')
      );
      const completedTasksSnapshot = await getDocs(completedTasksQuery);

      const stats = {
        totalSites,
        totalWorkers: activeWorkers.length,
        totalTasks: tasksSnapshot.size,
        completedTasks: completedTasksSnapshot.size,
      };

      console.log('[AdminService] Estatísticas calculadas:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalSites: 0,
        totalWorkers: 0,
        totalTasks: 0,
        completedTasks: 0,
      };
    }
  }

  /**
   * Configura listener em tempo real para tarefas
   */
  static async subscribeToTasks(
    siteId: string,
    callback: (tasks: any[]) => void
  ) {
    if (!siteId) {
      console.warn('siteId é undefined, retornando função vazia');
      return () => {};
    }

    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return () => {};

    const q = query(
      collection(db, 'tasks'),
      where('siteId', '==', siteId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      });
      callback(tasks);
    });
  }

  /**
   * Configura listener em tempo real para progresso
   */
  static async subscribeToProgress(
    siteId: string,
    callback: (progress: any) => void
  ) {
    if (!siteId) {
      console.warn('siteId é undefined, retornando função vazia');
      return () => {};
    }

    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return () => {};

    // Listener para tarefas que afetam o progresso
    const q = query(collection(db, 'tasks'), where('siteId', '==', siteId));

    return onSnapshot(q, async (querySnapshot) => {
      const tasks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          status: data.status || 'pending', // valor padrão para status
        };
      });

      // Calcular progresso em tempo real
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (task) => task.status === 'completed'
      ).length;
      const inProgressTasks = tasks.filter(
        (task) => task.status === 'in_progress'
      ).length;
      const pendingTasks = tasks.filter(
        (task) => task.status === 'pending'
      ).length;
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const progress = {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        lastUpdated: new Date().toISOString(),
      };

      callback(progress);
    });
  }

  /**
   * Configura listener em tempo real para atividades administrativas
   */
  static async subscribeToAdminActivities(
    siteId: string,
    callback: (activities: AdminActivity[]) => void
  ) {
    if (!siteId) {
      console.warn('siteId é undefined, retornando função vazia');
      return () => {};
    }

    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return () => {};

    const q = query(
      collection(db, 'adminActivities'),
      where('siteId', '==', siteId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (querySnapshot) => {
      const activities = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AdminActivity)
      );

      callback(activities);
    });
  }

  /**
   * Configura listener em tempo real para convites
   */
  static async subscribeToInvites(
    siteId: string,
    callback: (invites: any[]) => void
  ) {
    if (!siteId) {
      console.warn('siteId é undefined, retornando função vazia');
      return () => {};
    }

    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return () => {};

    const q = query(
      collection(db, 'invites'),
      where('siteId', '==', siteId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const invites = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(invites);
    });
  }

  /**
   * Configura listener em tempo real para colaboradores
   */
  static async subscribeToWorkers(
    siteId: string,
    callback: (workers: any[]) => void
  ) {
    if (!siteId) {
      console.warn('siteId é undefined, retornando função vazia');
      return () => {};
    }

    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') return () => {};

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'worker'),
      where('sites', 'array-contains', siteId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const workers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      callback(workers);
    });
  }

  /**
   * Envia uma mensagem individual entre administradores
   */
  static async sendDirectMessage(
    siteId: string,
    recipientId: string,
    message: string,
    clientId?: string
  ): Promise<AdminDirectMessage> {
    try {
      
      const currentUser = await AuthService.getCurrentUser();
      
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Apenas administradores podem enviar mensagens');
      }

      if (!currentUser.sites?.includes(siteId)) {
        throw new Error('Você não tem acesso a esta obra');
      }

      // Verificar se o destinatário existe
      const recipient = await AuthService.getUserById(recipientId);
      
      if (!recipient) {
        throw new Error('Destinatário não encontrado');
      }
      
      if (recipient.role !== 'admin') {
        throw new Error('Destinatário não é um administrador');
      }
      
      if (!recipient.sites?.includes(siteId)) {
        throw new Error('Destinatário não tem acesso à obra');
      }

      const messageData: Omit<AdminDirectMessage, 'id'> & { clientId?: string } = {
        siteId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        recipientId,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        message,
        createdAt: new Date().toISOString(), // CORRIGIDO: usar timestamp ISO
        readBy: [currentUser.id], // O remetente já leu
        ...(clientId ? { clientId } : {}),
      };

      const docRef = await addDoc(
        collection(db, 'adminDirectMessages'),
        messageData
      );

      // Atualizar ou criar sessão
      await this.updateChatSession(
        siteId,
        currentUser.id,
        recipientId,
        message
      );

      return {
        id: docRef.id,
        ...messageData,
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem individual:', error);
      throw error;
    }
  }

  /**
   * Busca mensagens individuais entre dois administradores
   */
  static async getDirectMessages(
    siteId: string,
    otherUserId: string,
    options?: { limitCount?: number }
  ): Promise<AdminDirectMessage[]> {
    const limitCount = options?.limitCount ?? 50;
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return [];
      }

      if (!currentUser.sites?.includes(siteId)) {
        return [];
      }

      // Buscar mensagens onde o usuário atual é remetente ou destinatário
      const q = query(
        collection(db, 'adminDirectMessages'),
        where('siteId', '==', siteId),
        where('senderId', 'in', [currentUser.id, otherUserId]),
        where('recipientId', 'in', [currentUser.id, otherUserId]),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AdminDirectMessage)
      );

      // Marcar mensagens como lidas
      const unreadMessages = messages.filter(
        (msg) =>
          msg.recipientId === currentUser.id &&
          !msg.readBy.includes(currentUser.id)
      );

      for (const msg of unreadMessages) {
        await this.markDirectMessageAsRead(msg.id);
      }

      return messages.reverse(); // Ordenar por data crescente
    } catch (error) {
      console.error('Erro ao buscar mensagens individuais:', error);
      return [];
    }
  }

  /**
   * Busca sessões de chat do administrador atual
   */
  static async getChatSessions(siteId: string): Promise<AdminChatSession[]> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return [];
      }

      if (!currentUser.sites?.includes(siteId)) {
        return [];
      }

      const q = query(
        collection(db, 'adminChatSessions'),
        where('siteId', '==', siteId),
        where('participants', 'array-contains', currentUser.id),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AdminChatSession)
      );
    } catch (error) {
      console.error('Erro ao buscar sessões de chat:', error);
      return [];
    }
  }

  /**
   * Atualiza ou cria uma sessão de chat
   */
  private static async updateChatSession(
    siteId: string,
    senderId: string,
    recipientId: string,
    lastMessage: string
  ): Promise<void> {
    try {
      const participants = [senderId, recipientId].sort();
      const sessionId = `${siteId}_${participants.join('_')}`;

      const sessionRef = doc(db, 'adminChatSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      const currentUser = await AuthService.getCurrentUser();
      const recipient = await AuthService.getUserById(recipientId);

      if (!currentUser || !recipient) return;

      // Garantir que os nomes estejam na mesma ordem dos IDs ordenados
      const participantNames = participants.map((id) => {
        if (id === currentUser.id) return currentUser.name;
        if (id === recipient.id) return recipient.name;
        return 'Usuário desconhecido';
      });

      if (sessionDoc.exists()) {
        // Atualizar sessão existente
        await updateDoc(sessionRef, {
          lastMessage,
          lastMessageTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Criar nova sessão
        const sessionData: AdminChatSession = {
          id: sessionId,
          siteId,
          participants,
          participantNames,
          lastMessage,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(sessionRef, sessionData);
      }
    } catch (error) {
      console.error('Erro ao atualizar sessão de chat:', error);
    }
  }

  /**
   * Marca uma mensagem individual como lida
   */
  static async markDirectMessageAsRead(messageId: string): Promise<void> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return;

      const messageRef = doc(db, 'adminDirectMessages', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) return;

      const message = messageDoc.data() as AdminDirectMessage;
      if (!message.readBy.includes(currentUser.id)) {
        // Se o usuário atual é o destinatário, além de adicionar no readBy, também preenche o readAt
        if (message.recipientId === currentUser.id) {
          await updateDoc(messageRef, {
            readBy: [...message.readBy, currentUser.id],
            readAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          await updateDoc(messageRef, {
            readBy: [...message.readBy, currentUser.id],
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Erro ao marcar mensagem individual como lida:', error);
    }
  }

  /**
   * Deleta uma mensagem individual
   */
  static async deleteDirectMessage(messageId: string): Promise<void> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar mensagens');
      }

      const messageRef = doc(db, 'adminDirectMessages', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Mensagem não encontrada');
      }

      const message = messageDoc.data() as AdminDirectMessage;
      if (message.senderId !== currentUser.id) {
        throw new Error('Apenas o remetente pode deletar a mensagem');
      }

      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Erro ao deletar mensagem individual:', error);
      throw error;
    }
  }

  /**
   * Inscreve-se para receber mensagens individuais em tempo real
   */
  static async subscribeToDirectMessages(
    siteId: string,
    otherUserId: string,
    callback: (messages: AdminDirectMessage[]) => void
  ) {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return () => {};
      }

      // Usar uma consulta mais simples para evitar problemas com o Firestore
      const q = query(
        collection(db, 'adminDirectMessages'),
        where('siteId', '==', siteId),
        orderBy('createdAt', 'asc')
      );

      return onSnapshot(q, (snapshot) => {
        // Filtrar mensagens localmente para evitar consultas complexas
        const messages = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              clientId: data.clientId || undefined, // força o campo a existir
            } as AdminDirectMessage;
          })
          .filter(msg => 
            (msg.senderId === currentUser.id && msg.recipientId === otherUserId) || 
            (msg.senderId === otherUserId && msg.recipientId === currentUser.id)
          );
        callback(messages);
      });
    } catch (error) {
      console.error('❌ Erro ao inscrever-se para mensagens individuais:', error);
      return () => {};
    }
  }

  /**
   * Conta mensagens não lidas para o usuário atual
   */
  static async getUnreadDirectMessagesCount(siteId: string): Promise<number> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return 0;
      }

      if (!currentUser.sites?.includes(siteId)) {
        return 0;
      }

      const q = query(
        collection(db, 'adminDirectMessages'),
        where('siteId', '==', siteId),
        where('recipientId', '==', currentUser.id),
        where('readBy', 'not-in', [[currentUser.id]])
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Erro ao contar mensagens não lidas:', error);
      return 0;
    }
  }

  /**
   * Inscreve-se para receber contagem de mensagens não lidas em tempo real
   */
  static subscribeToUnreadDirectMessagesCount(
    siteId: string,
    callback: (count: number) => void
  ) {
    let unsubscribe = () => {};
    AuthService.getCurrentUser().then(currentUser => {
      if (!currentUser || currentUser.role !== 'admin') return;
      if (!currentUser.sites?.includes(siteId)) return;

      const q = query(
        collection(db, 'adminDirectMessages'),
        where('siteId', '==', siteId),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const unreadCount = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as AdminDirectMessage))
          .filter(msg => 
            msg.recipientId === currentUser.id && 
            (!msg.readBy || !msg.readBy.includes(currentUser.id))
          ).length;
        callback(unreadCount);
      });
    });
    return () => unsubscribe();
  }

  /**
   * Inscreve-se para receber sessões de chat em tempo real
   */
  static async subscribeToChatSessions(
    siteId: string,
    callback: (sessions: AdminChatSession[]) => void
  ) {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return () => {};
      }

      const q = query(
        collection(db, 'adminChatSessions'),
        where('siteId', '==', siteId),
        where('participants', 'array-contains', currentUser.id),
        orderBy('updatedAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as AdminChatSession)
        );
        callback(sessions);
      });
    } catch (error) {
      console.error('Erro ao inscrever-se para sessões de chat:', error);
      return () => {};
    }
  }

  // Deleta todas as mensagens entre os participantes de uma sessão
  static async deleteDirectMessagesForSession(
    siteId: string,
    participants: string[]
  ): Promise<void> {
    try {
      const q = query(
        collection(db, 'adminDirectMessages'),
        where('siteId', '==', siteId),
        where('senderId', 'in', participants),
        where('recipientId', 'in', participants)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    } catch (error) {
      console.error('Erro ao deletar mensagens da sessão:', error);
      throw error;
    }
  }

  // Deleta a sessão de chat
  static async deleteChatSession(sessionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'adminChatSessions', sessionId));
    } catch (error) {
      console.error('Erro ao deletar sessão de chat:', error);
      throw error;
    }
  }

  static async getWorkers(siteId: string): Promise<Worker[]> {
    // Implement the logic to fetch workers from your data source
    // Using Firestore v9 modular API
    const workersCollection = collection(db, 'sites', siteId, 'workers');
    const snapshot = await getDocs(workersCollection);

    return snapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as Worker[];
  }

  // ========== FUNCIONALIDADES ADICIONAIS INTEGRADAS ==========

  /**
   * Busca mensagens diretas do admin com query otimizada
   * Integrado do Untitled-2.ts
   */
  static async getAdminDirectMessages(
    siteId: string,
    options?: { limitCount?: number }
  ): Promise<AdminDirectMessage[]> {
    const limitCount = options?.limitCount ?? 50;
    try {
      const q = query(
        collection(db, 'adminDirectMessages'),
        where('siteId', '==', siteId),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdminDirectMessage));
      
      return messages;
    } catch (error) {
      console.error('Erro ao buscar mensagens diretas do admin:', error);
      throw error;
    }
  }

  /**
   * Processa snapshot do Firestore para AdminDirectMessage
   * Integrado do Untitled-3.ts
   */
  static processSnapshot(snapshot: any): AdminDirectMessage[] {
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as AdminDirectMessage));
  }

  /**
   * Conta mensagens não lidas de um snapshot
   * Integrado do Untitled-3.ts
   */
  static countUnreadMessagesFromSnapshot(snapshot: any): number {
    return snapshot.docs.filter((doc: any) => !doc.data().isRead).length;
  }

  /**
   * Cria query entre dois usuários específicos
   * Integrado do Untitled-3.ts
   */
  static createUserQuery(currentUser: string, otherUserId: string, siteId: string) {
    return query(
      collection(db, 'adminDirectMessages'),
      where('siteId', '==', siteId),
      where('participants', 'in', [
        [currentUser, otherUserId],
        [otherUserId, currentUser]
      ]),
      orderBy('createdAt', 'desc')
    );
  }

  /**
   * Cria query simples reutilizável
   * Integrado do Untitled-1.ts
   */
  static createQuery(siteId: string) {
    return query(
      collection(db, 'adminDirectMessages'),
      where('siteId', '==', siteId),
      orderBy('createdAt', 'asc')
    );
  }

  /**
   * Limpa mensagens pendentes (função auxiliar)
   * Integrado do Untitled-4.ts
   */
  static clearPendingMessages(): void {
  }

  /**
   * Adiciona mensagem pendente (função auxiliar)
   * Integrado do Untitled-4.ts
   */
  static addPendingMessage(message: AdminDirectMessage): void {
  }
}

// Exemplo de chamada para uma Cloud Function
export async function getAdminStats() {
  const getStats = httpsCallable(functions, 'getAdminStats');
  const result = await getStats();
  return result.data;
}
