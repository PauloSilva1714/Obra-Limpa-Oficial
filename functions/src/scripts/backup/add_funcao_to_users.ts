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

async function addFuncaoToUsers() {
  
  const usersSnapshot = await db.collection('users').get();

  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    
    // Verificar se o campo funcao já existe
    if (userData.funcao !== undefined) {
      skippedCount++;
      continue;
    }

    // Definir função baseada no role do usuário
    let funcao = 'Função não informada';
    
    if (userData.role === 'admin') {
      funcao = 'Administrador';
    } else if (userData.role === 'worker') {
      funcao = 'Colaborador';
    }

    await doc.ref.update({ funcao });
    updatedCount++;
  }

}

addFuncaoToUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro ao atualizar usuários:', err);
    process.exit(1);
  }); 