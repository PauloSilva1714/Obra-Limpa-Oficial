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
  console.log(`🔍 Atualizando função do usuário ${userId} no Firestore para: "${newFuncao}"`);
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('❌ Usuário não encontrado no Firestore');
      return false;
    }

    const userData = userDoc.data();
    console.log(`📋 Usuário encontrado: ${userData?.name} (${userData?.email})`);
    console.log(`📋 Função atual no Firestore: "${userData?.funcao}"`);
    console.log(`📋 Role: ${userData?.role}`);

    await userDoc.ref.update({ funcao: newFuncao });
    console.log(`✅ Função atualizada no Firestore para: "${newFuncao}"`);
    
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
      console.log('\n🎉 Função atualizada no Firestore com sucesso!');
      console.log('💡 Agora faça logout e login novamente no app para ver a mudança no AsyncStorage.');
    } else {
      console.log('\n❌ Falha ao atualizar função no Firestore');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
  }); 