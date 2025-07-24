import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = getFirestore();

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'worker';
  siteId?: string;
}

export async function deleteAdmin(adminUserId: string, deletedBy: string, reason?: string) {
  try {
    
    // 1. Verificar se o usuário existe e é admin
    const userRef = db.collection('users').doc(adminUserId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('Usuário não encontrado');
    }
    
    const userData = userDoc.data() as User;
    
    if (userData.role !== 'admin') {
      throw new Error('Usuário não é administrador');
    }
    
    
    // 2. Verificar se quem está deletando é admin
    const deleterRef = db.collection('users').doc(deletedBy);
    const deleterDoc = await deleterRef.get();
    
    if (!deleterDoc.exists) {
      throw new Error('Usuário que está deletando não encontrado');
    }
    
    const deleterData = deleterDoc.data() as User;
    
    if (deleterData.role !== 'admin') {
      throw new Error('Apenas administradores podem deletar outros administradores');
    }
    
    // 3. Verificar se não está tentando deletar a si mesmo
    if (adminUserId === deletedBy) {
    }
    
    // 4. Verificar se existem outros admins ativos (apenas se não for auto-deleção)
    if (adminUserId !== deletedBy) {
      const activeAdmins = await listActiveAdmins();
      const otherActiveAdmins = activeAdmins.filter(admin => admin.id !== adminUserId);
      
      if (otherActiveAdmins.length === 0) {
        throw new Error('Não é possível deletar o último administrador ativo');
      }
    }
    
    
    // 5. Fechar sessões de chat do admin
    const chatSessionsRef = db.collection('adminChatSessions');
    const chatSessions = await chatSessionsRef
      .where('participants', 'array-contains', adminUserId)
      .get();
    
    for (const session of chatSessions.docs) {
      await session.ref.update({
        isActive: false,
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
        closedBy: deletedBy,
        reason: 'Admin deletado'
      });
    }
    
    
    // 6. Deletar o admin
    await userRef.delete();
    
    
    // 7. Log da ação
    await db.collection('adminActions').add({
      action: 'delete_admin',
      targetUserId: adminUserId,
      targetUserName: userData.name,
      targetUserEmail: userData.email,
      performedBy: deletedBy,
      performedByUser: deleterData.name,
      performedAt: admin.firestore.FieldValue.serverTimestamp(),
      reason: reason || (adminUserId === deletedBy ? 'Admin deletou a si mesmo' : 'Admin deletado por outro administrador'),
      isSelfDeletion: adminUserId === deletedBy
    });
    
    
    // 8. Contar admins restantes (se não for auto-deleção)
    let remainingAdmins = 0;
    if (adminUserId !== deletedBy) {
      const activeAdmins = await listActiveAdmins();
      remainingAdmins = activeAdmins.length;
    }
    
    return {
      success: true,
      message: `Admin ${userData.name} deletado com sucesso`,
      deletedAt: new Date().toISOString(),
      remainingAdmins: remainingAdmins,
      isSelfDeletion: adminUserId === deletedBy
    };
    
  } catch (error) {
    console.error('[DELETE_ADMIN] Erro:', error);
    throw error;
  }
}

// Função para listar admins ativos
export async function listActiveAdmins() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('role', '==', 'admin')
      .get();
    
    const admins = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return admins;
  } catch (error) {
    console.error('[LIST_ACTIVE_ADMINS] Erro:', error);
    throw error;
  }
}

// Função para verificar se um usuário é admin
export async function isUserAdmin(userId: string) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data() as User;
    return userData.role === 'admin';
  } catch (error) {
    console.error('[IS_USER_ADMIN] Erro:', error);
    return false;
  }
}

// Exemplo de uso
if (require.main === module) {
  const adminUserId = process.argv[2];
  const deletedBy = process.argv[3];
  const reason = process.argv[4];
  
  if (!adminUserId || !deletedBy) {
    process.exit(1);
  }
  
  deleteAdmin(adminUserId, deletedBy, reason)
    .then(result => {
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    });
} 