import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import ChatScreen from '../admin-only/chat';

export default function ChatTab() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    AuthService.getUserRole().then(role => {
      setIsAdmin(role === 'admin');
      if (role !== 'admin') {
        router.replace('/(tabs)');
      }
    });
  }, []);

  if (isAdmin === null) return null; // ou um loading

  return isAdmin ? <ChatScreen /> : null;
} 