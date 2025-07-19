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

async function updateUserFuncao(userId: string, newFuncao: string) {
  console.log(`🔍 Atualizando função do usuário ${userId} para: "${newFuncao}"`);
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('❌ Usuário não encontrado');
      return false;
    }

    const userData = userDoc.data();
    console.log(`📋 Usuário encontrado: ${userData?.name} (${userData?.email})`);
    console.log(`📋 Função atual: "${userData?.funcao}"`);
    console.log(`📋 Role: ${userData?.role}`);

    await userDoc.ref.update({ funcao: newFuncao });
    console.log(`✅ Função atualizada com sucesso para: "${newFuncao}"`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar função:', error);
    return false;
  }
}

// Exemplo de uso: atualizar o usuário Paulo para "Administrador"
const userId = 'ajvKgdiTvAVJ27GxEFs824kaMqo1'; // ID do Paulo
const newFuncao = 'Administrador';

updateUserFuncao(userId, newFuncao)
  .then((success) => {
    if (success) {
      console.log('\n🎉 Função atualizada com sucesso!');
    } else {
      console.log('\n❌ Falha ao atualizar função');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
  }); 