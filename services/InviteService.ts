import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthService } from './AuthService';

export const InviteService = {
  async getPendingInvites() {
    const q = query(collection(db, 'invites'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  },

  async deleteInvite(inviteId: string) {
    await deleteDoc(doc(db, 'invites', inviteId));
  },

  getInvitesForCurrentUser: async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || !currentUser.email) {
        console.warn('Nenhum usuário logado ou e-mail do usuário indisponível.');
        return [];
      }

      console.log(`Buscando convites para o e-mail: ${currentUser.email}`);

      const invitesRef = collection(db, 'invites');
      const q = query(invitesRef, where('email', '==', currentUser.email));
      
      const querySnapshot = await getDocs(q);
      const invites = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Encontrados ${invites.length} convites.`);
      return invites;
    } catch (error) {
      console.error('Erro ao buscar convites para o usuário atual:', error);
      throw new Error('Não foi possível buscar os convites.');
    }
  },

  // Adicionando função para buscar convite por ID
  async getInviteById(inviteId: string) {
    try {
      const docRef = doc(db, 'invites', inviteId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
      return null;
    }
  },
}; 