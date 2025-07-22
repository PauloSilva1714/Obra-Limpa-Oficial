// Imports necessários do Firestore
import { query, collection, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './config/firebase';

// Exemplo de função que usa a query do Firestore
export const getDirectMessages = async (siteId: string) => {
  try {
    // Query do Firestore com todos os imports corretos
    const q = query(
      collection(db, 'adminDirectMessages'),
      where('siteId', '==', siteId),
      orderBy('createdAt', 'asc')
    );

    // Executar a query
    const querySnapshot = await getDocs(q);
    
    // Processar os resultados
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return messages;
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    throw error;
  }
};

// Exemplo de uso em um componente React
/*
import React, { useEffect, useState } from 'react';

export const MyComponent = ({ siteId }: { siteId: string }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getDirectMessages(siteId);
        setMessages(data);
      } catch (error) {
        console.error('Erro:', error);
      }
    };

    fetchMessages();
  }, [siteId]);

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
};
*/