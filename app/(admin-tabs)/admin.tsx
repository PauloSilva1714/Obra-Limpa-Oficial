import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthService } from '@/services/AuthService';
import AdminScreen from '../admin-only/admin';

export default function AdminTab() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    AuthService.getUserRole().then(role => {
      setIsAdmin(role === 'admin');
      if (role !== 'admin') {
        router.replace('/(worker-tabs)');
      }
    });
  }, []);

  if (isAdmin === null) return null;

  return isAdmin ? <AdminScreen /> : null;
}
