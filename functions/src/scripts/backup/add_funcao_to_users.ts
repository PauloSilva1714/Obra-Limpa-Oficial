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
  console.log('🔍 Iniciando verificação e atualização do campo funcao...');
  
  const usersSnapshot = await db.collection('users').get();
  console.log(`📊 Total de usuários encontrados: ${usersSnapshot.docs.length}`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    
    // Verificar se o campo funcao já existe
    if (userData.funcao !== undefined) {
      console.log(`⏭️ Usuário ${userData.name} (${doc.id}) já possui funcao: "${userData.funcao}"`);
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
    console.log(`✅ Usuário ${userData.name} (${doc.id}) atualizado com funcao: "${funcao}"`);
    updatedCount++;
  }

  console.log('\n📈 Resumo da operação:');
  console.log(`✅ Usuários atualizados: ${updatedCount}`);
  console.log(`⏭️ Usuários ignorados (já possuem funcao): ${skippedCount}`);
  console.log(`📊 Total processado: ${usersSnapshot.docs.length}`);
}

addFuncaoToUsers()
  .then(() => {
    console.log('\n🎉 Operação concluída com sucesso!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro ao atualizar usuários:', err);
    process.exit(1);
  }); 