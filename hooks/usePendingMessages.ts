// Hook personalizado para gerenciar mensagens pendentes
// Integrado do Untitled-4.ts
import React, { useState, useEffect } from 'react';
import { query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AdminService } from '../services/AdminService';

// Interface para mensagens pendentes
interface PendingMessage {
  id: string;
  message: string;
  timestamp: Date;
  userId: string;
  siteId: string;
  senderId: string;
  recipientId: string;
}

/**
 * Hook personalizado para gerenciar mensagens pendentes em tempo real
 * Integrado do Untitled-4.ts
 */
export const usePendingMessages = (currentUser: string, otherUserId: string, siteId: string) => {
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !otherUserId || !siteId) {
      setLoading(false);
      return;
    }

    try {
      // Query para mensagens entre os usuários
      const messagesQuery = query(
        collection(db, 'adminDirectMessages'),
        where('siteId', '==', siteId),
        where('participants', 'array-contains-any', [currentUser, otherUserId]),
        orderBy('createdAt', 'desc')
      );

      // Listener em tempo real
      const unsubscribe = onSnapshot(
        messagesQuery, 
        (snapshot) => {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as PendingMessage));
          
          setPendingMessages(messages);
          setLoading(false);
          setError(null);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [currentUser, otherUserId, siteId]);

  // Função para limpar mensagens pendentes
  const clearPendingMessages = () => {
    setPendingMessages([]);
    AdminService.clearPendingMessages();
  };

  // Função para adicionar mensagem pendente
  const addPendingMessage = (message: PendingMessage) => {
    setPendingMessages(prev => [...prev, message]);
  };

  // Função para marcar mensagem como lida
  const markAsRead = async (messageId: string) => {
    try {
      await AdminService.markMessageAsRead(messageId, { userId: currentUser, collection: 'adminDirectMessages' });
      // Atualizar estado local
      setPendingMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isRead: true } 
            : msg
        )
      );
    } catch (error) {
      }
  };

  return { 
    pendingMessages, 
    setPendingMessages, 
    clearPendingMessages, 
    addPendingMessage,
    markAsRead,
    loading,
    error
  };
};

/**
 * Hook para contagem de mensagens não lidas
 */
export const useUnreadMessagesCount = (siteId: string) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) {
      setLoading(false);
      return;
    }

    const unsubscribe = AdminService.subscribeToUnreadDirectMessagesCount(
      siteId,
      (count) => {
        setUnreadCount(count);
        setLoading(false);
      }
    ) as () => void;

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [siteId]);

  return { unreadCount, loading };
};