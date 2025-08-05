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
  content: string; // Mudado de 'message' para 'content' para consistência
  type: 'general' | 'task' | 'alert' | 'announcement' | 'image'; // Adicionado 'image'
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string | Timestamp | FieldValue;
  updatedAt?: string;
  readBy: string[];
  attachments?: string[];
  recipientId?: string;
  isPrivate?: boolean;
  clientId?: string; // Adicionado para suporte a mensagens otimistas
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
  content: string; // CORRIGIDO: usar 'content' em vez de 'message'
  type: 'text' | 'image' | 'file'; // ADICIONADO: tipo da mensagem
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
    priority: AdminMessage['priority'] = 'medium',
    clientId?: string,
    attachments?: string[]
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
        content: message, // CORRIGIDO: usar 'content' em vez de 'message'
        type,
        priority,
        createdAt: serverTimestamp(), // CORRIGIDO
        readBy: [currentUser.id], // O remetente já leu
        attachments: attachments || [],
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

      const result = {
        id: docRef.id,
        ...messageData,
      };

      return result;
    } catch (error) {
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

        return [];
      }

      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser || currentUser.role !== 'admin') {

        return [];
      }

      if (!currentUser.sites?.includes(siteId)) {

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
        (doc) => {
          const data = doc.data();
          // Lidar com mensagens antigas que usam 'message' em vez de 'content'
          const messageContent = data.content || data.message || '';

          return {
            id: doc.id,
            ...data,
            content: messageContent, // Garantir que sempre use 'content'
          } as AdminMessage;
        }
      );

      return messages;
    } catch (error) {

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

        return [];
      }

      if (currentUser.role !== 'admin') {

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

        return [];
      }

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
      }
  }

  /**
   * Busca outros administradores da mesma obra
   */
  static async getOtherAdmins(siteId: string): Promise<User[]> {
    try {
      if (!siteId) {
        return [];
      }

      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return [];

      const admins = await AuthService.getSiteAdmins(siteId);
      const filteredAdmins = admins.filter((admin) => admin.id !== currentUser.id);
      return filteredAdmins;
    } catch (error) {
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
        return;
      }

      const otherAdmins = await this.getOtherAdmins(siteId);

      const currentUser = await AuthService.getCurrentUser();
      const senderName = currentUser?.name || 'Administrador';

      const notifications = otherAdmins.map((admin) => {
        const notification: any = {
          siteId,
          recipientId: admin.id,
          senderId,
          senderName,
          type,
          title,
          message,
          read: false,
          createdAt: new Date().toISOString(),
        };

        // Só incluir actionUrl se ele não for undefined
        if (actionUrl !== undefined) {
          notification.actionUrl = actionUrl;
        }

        return notification;
      });

      // Adicionar notificações em lote
      const batch = notifications.map((notification) =>
        addDoc(collection(db, 'adminNotifications'), notification)
      );

      await Promise.all(batch);
    } catch (error) {
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
        return () => {};
      }

      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser || currentUser.role !== 'admin') {
        return () => {};
      }

      if (!currentUser.sites?.includes(siteId)) {
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
          }
      );

      return unsubscribe;
    } catch (error) {
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
          message: msg.content,
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
      if (!currentSite) {
        return {
          totalSites,
          totalWorkers: activeWorkers.length,
          totalTasks: 0,
          completedTasks: 0,
        };
      }

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

      return stats;
    } catch (error) {
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
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    clientId?: string,
    attachments?: string[]
  ): Promise<AdminDirectMessage> {
    try {
      // Log removido para produção

      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        const error = 'Apenas administradores podem enviar mensagens';
        throw new Error(error);
      }

      if (!currentUser.sites?.includes(siteId)) {
        const error = 'Você não tem acesso a esta obra';
        throw new Error(error);
      }

      // Verificar se o destinatário existe
      const recipient = await AuthService.getUserById(recipientId);
      if (!recipient) {
        const error = 'Destinatário não encontrado';
        throw new Error(error);
      }

      if (recipient.role !== 'admin') {
        const error = 'Destinatário não é um administrador';
        throw new Error(error);
      }

      // Verificar se há pelo menos um site em comum entre remetente e destinatário
      const commonSites = currentUser.sites?.filter(site => recipient.sites?.includes(site)) || [];
      if (commonSites.length === 0) {
        const error = 'Destinatário não compartilha nenhuma obra em comum';
        throw new Error(error);
      }

      // Se o destinatário não tem acesso ao site atual, usar o primeiro site em comum
      let finalSiteId = siteId;
      if (!recipient.sites?.includes(siteId)) {
        finalSiteId = commonSites[0];
        }

      const messageData: Omit<AdminDirectMessage, 'id'> & { clientId?: string } = {
        siteId: finalSiteId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        recipientId,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        content, // CORRIGIDO: usar 'content' em vez de 'message'
        type, // ADICIONADO: tipo da mensagem
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), // ADICIONADO: campo updatedAt
        readBy: [currentUser.id], // O remetente já leu
        attachments: attachments || [],
        ...(clientId ? { clientId } : {}),
      };

      const docRef = await addDoc(
        collection(db, 'adminDirectMessages'),
        messageData
      );

      // Atualizar ou criar sessão
      await this.updateChatSession(
        finalSiteId,
        currentUser.id,
        recipientId,
        content
      );

      const result = {
        id: docRef.id,
        ...messageData,
      };

      return result;
    } catch (error: any) {
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
    const limitCount = options?.limitCount ?? 100; // Aumentando limite padrão para 100
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return [];
      }

      if (!currentUser.sites?.includes(siteId)) {
        return [];
      }

      // DEBUG: Verificar se há mensagens na coleção adminDirectMessages
      const testQuery = query(
        collection(db, 'adminDirectMessages'),
        limit(50) // Aumentando para 50 para ver mais mensagens
      );
      const testSnapshot = await getDocs(testQuery);

      // Contar total de documentos na coleção
      const countQuery = query(collection(db, 'adminDirectMessages'));
      const countSnapshot = await getDocs(countQuery);
      // Debug: verificar dados dos documentos
      testSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        // Log removido para produção
      });

      // Buscar informações do outro usuário para encontrar sites compartilhados
      const otherUser = await AuthService.getUserById(otherUserId);
      if (!otherUser) {
        return [];
      }

      // Encontrar sites compartilhados
      const sharedSites = currentUser.sites?.filter(site => otherUser.sites?.includes(site)) || [];
      if (sharedSites.length === 0) {
        return [];
      }

      // Buscar mensagens em todos os sites compartilhados
      const allQueries: Promise<any>[] = [];

      for (const sharedSiteId of sharedSites) {
        // Query 1: Mensagens enviadas pelo usuário atual para o outro usuário
        const q1 = query(
          collection(db, 'adminDirectMessages'),
          where('siteId', '==', sharedSiteId),
          where('senderId', '==', currentUser.id),
          where('recipientId', '==', otherUserId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        // Query 2: Mensagens enviadas pelo outro usuário para o usuário atual
        const q2 = query(
          collection(db, 'adminDirectMessages'),
          where('siteId', '==', sharedSiteId),
          where('senderId', '==', otherUserId),
          where('recipientId', '==', currentUser.id),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        allQueries.push(getDocs(q1), getDocs(q2));
      }

      const queryResults = await Promise.all(allQueries);

      let totalMessages = 0;
      queryResults.forEach(snapshot => {
        totalMessages += snapshot.size;
      });

      // Processar mensagens de todos os resultados
      const allMessages: AdminDirectMessage[] = [];

      queryResults.forEach((querySnapshot) => {
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();

          // Corrigir mensagens antigas que não têm o campo 'content'
          let processedData = { ...data };
          if (!processedData.content && processedData.message) {
            // Migrar campo 'message' para 'content'
            processedData.content = processedData.message;
            } else if (!processedData.content && !processedData.message) {
            // Mensagem sem conteúdo
            processedData.content = '[Mensagem sem conteúdo]';
            }

          // Determinar o tipo correto baseado nos attachments
          if (!processedData.type) {
            if (processedData.attachments && processedData.attachments.length > 0) {
              const firstAttachment = processedData.attachments[0];
              if (firstAttachment.includes('.jpg') || firstAttachment.includes('.jpeg') ||
                  firstAttachment.includes('.png') || firstAttachment.includes('.gif')) {
                processedData.type = 'image';
                } else if (firstAttachment.includes('.mp4') || firstAttachment.includes('.mov') ||
                         firstAttachment.includes('.avi')) {
                processedData.type = 'video';
                } else {
                processedData.type = 'file';
                }
            } else {
              processedData.type = 'text';
            }
          }

          allMessages.push({
            id: doc.id,
            ...processedData,
          } as AdminDirectMessage);
        });
      });

      // Remover duplicatas (caso existam mensagens duplicadas entre sites)
      const uniqueMessages = allMessages.filter((message, index, self) =>
        index === self.findIndex(m => m.id === message.id)
      );

      // Ordenar todas as mensagens por data
      uniqueMessages.sort((a, b) => {
        const getTime = (createdAt: any) => {
          if (!createdAt) return 0;
          if (typeof createdAt === 'string') return new Date(createdAt).getTime();
          if (createdAt.toDate) return createdAt.toDate().getTime();
          return 0;
        };
        return getTime(a.createdAt) - getTime(b.createdAt);
      });

      // Aplicar limite se necessário
      const finalMessages = uniqueMessages.slice(0, limitCount);

      // Marcar mensagens como lidas
      const unreadMessages = finalMessages.filter(
        (msg) =>
          msg.recipientId === currentUser.id &&
          !msg.readBy.includes(currentUser.id)
      );

      for (const msg of unreadMessages) {
        await this.markDirectMessageAsRead(msg.id);
      }

      return finalMessages;
    } catch (error) {
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

      // Buscar informações do outro usuário para encontrar sites compartilhados
      const otherUser = await AuthService.getUserById(otherUserId);
      if (!otherUser) {
        return () => {};
      }

      // Encontrar sites compartilhados
      const sharedSites = currentUser.sites?.filter(site => otherUser.sites?.includes(site)) || [];
      if (sharedSites.length === 0) {
        return () => {};
      }

      // Criar múltiplos listeners para todos os sites compartilhados
      const unsubscribeFunctions: (() => void)[] = [];
      const allMessages = new Map<string, AdminDirectMessage>();

      const updateCallback = () => {
        const sortedMessages = Array.from(allMessages.values()).sort((a, b) => {
          const getTime = (createdAt: any) => {
            if (!createdAt) return 0;
            if (typeof createdAt === 'string') return new Date(createdAt).getTime();
            if (createdAt.toDate) return createdAt.toDate().getTime();
            return 0;
          };
          return getTime(a.createdAt) - getTime(b.createdAt);
        });
        callback(sortedMessages);
      };

      // Criar listener para cada site compartilhado
      for (const sharedSiteId of sharedSites) {
        const q = query(
          collection(db, 'adminDirectMessages'),
          where('siteId', '==', sharedSiteId),
          orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          // Filtrar mensagens localmente para evitar consultas complexas
          const siteMessages = snapshot.docs
            .map(doc => {
              const data = doc.data();

              // Corrigir mensagens antigas que não têm o campo 'content'
              let processedData = { ...data };
              if (!processedData.content && processedData.message) {
                // Migrar campo 'message' para 'content'
                processedData.content = processedData.message;
                } else if (!processedData.content && !processedData.message) {
                // Mensagem sem conteúdo
                processedData.content = '[Mensagem sem conteúdo]';
                }

              // Garantir que o tipo existe
              if (!processedData.type) {
                processedData.type = 'text';
              }

              return {
                id: doc.id,
                ...processedData,
                clientId: processedData.clientId || undefined,
              } as AdminDirectMessage;
            })
            .filter(msg =>
              (msg.senderId === currentUser.id && msg.recipientId === otherUserId) ||
              (msg.senderId === otherUserId && msg.recipientId === currentUser.id)
            );

          // Atualizar o mapa de mensagens
          siteMessages.forEach(msg => {
            allMessages.set(msg.id, msg);
          });

          // Remover mensagens que não existem mais neste site
          const currentSiteMessageIds = new Set(siteMessages.map(msg => msg.id));
          for (const [messageId, message] of allMessages.entries()) {
            if (message.siteId === sharedSiteId && !currentSiteMessageIds.has(messageId)) {
              allMessages.delete(messageId);
            }
          }

          updateCallback();
        });

        unsubscribeFunctions.push(unsubscribe);
      }

      // Retornar função que cancela todos os listeners
      return () => {
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      };
    } catch (error) {
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
      throw error;
    }
  }

  // Deleta a sessão de chat
  static async deleteChatSession(sessionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'adminChatSessions', sessionId));
    } catch (error) {
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

  /**
   * Busca todas as obras (sites) do sistema
   */
  static async getAllSites(): Promise<Site[]> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return [];
      }

      const sitesQuery = query(
        collection(db, 'sites'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(sitesQuery);

      const sites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Site));

      return sites;
    } catch (error) {
      return [];
    }
  }

  /**
   * Busca todas as obras do usuário atual
   */
  static async getUserSites(): Promise<Site[]> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        return [];
      }

      if (!currentUser.sites || currentUser.sites.length === 0) {
        return [];
      }

      const sites: Site[] = [];
      for (const siteId of currentUser.sites) {
        try {
          const siteDoc = await getDoc(doc(db, 'sites', siteId));
          if (siteDoc.exists()) {
            sites.push({
              id: siteDoc.id,
              ...siteDoc.data()
            } as Site);
          }
        } catch (error) {
          }
      }

      return sites;
    } catch (error) {
      return [];
    }
  }

  /**
   * Migra mensagens antigas que usam 'message' para 'content'
   * Esta função deve ser chamada uma vez para corrigir mensagens antigas
   */
  static async migrateOldDirectMessages(): Promise<void> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        return;
      }

      // Buscar todas as mensagens que usam o campo 'message' em vez de 'content'
      const q = query(
        collection(db, 'adminDirectMessages'),
        where('message', '!=', null)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      let updatedCount = 0;

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.message && !data.content) {
          // Migrar 'message' para 'content'
          const updateData: any = {
            content: data.message,
            type: data.type || 'text' // Garantir que tenha tipo
          };

          // Se tem attachments e não tem type definido, definir como 'image'
          if (data.attachments && data.attachments.length > 0 && !data.type) {
            const firstAttachment = data.attachments[0];
            if (firstAttachment.includes('.jpg') || firstAttachment.includes('.jpeg') ||
                firstAttachment.includes('.png') || firstAttachment.includes('.gif')) {
              updateData.type = 'image';
            }
          }

          batch.update(doc.ref, updateData);
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        } else {
        }
    } catch (error) {
      }
  }
}

// Exemplo de chamada para uma Cloud Function
export async function getAdminStats() {
  const getStats = httpsCallable(functions, 'getAdminStats');
  const result = await getStats();
  return result.data;
}
