import * as admin from 'firebase-admin';
import * as path from 'path';

// Ajuste o caminho do serviceAccountKey.json conforme necessário
const serviceAccount = require(path.resolve(__dirname, '../../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function updateUserInFirestore(userId: string, newFuncao: string) {
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return false;
    }

    await userDoc.ref.update({ funcao: newFuncao });
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar função no Firestore:', error);
    return false;
  }
}

// Atualizar o usuário Paulo
const userId = 'ajvKgdiTvAVJ27GxEFs824kaMqo1'; // ID do Paulo
const newFuncao = 'Administrador';

updateUserInFirestore(userId, newFuncao)
  .then((success) => {
    if (success) {
    } else {
    }
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });