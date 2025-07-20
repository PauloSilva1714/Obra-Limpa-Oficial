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

async function updateTasksWithPhotoURL() {
  console.log('🔍 Buscando todas as tarefas...');
  const tasksSnapshot = await db.collection('tasks').get();
  console.log(`📊 Total de tarefas encontradas: ${tasksSnapshot.docs.length}`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const taskDoc of tasksSnapshot.docs) {
    const task = taskDoc.data();
    const createdByName = task.createdByName;
    if (!createdByName) {
      console.log(`⏭️ Tarefa ${taskDoc.id} não possui createdByName, pulando.`);
      skippedCount++;
      continue;
    }

    // Buscar usuário pelo nome
    const usersSnapshot = await db.collection('users').where('name', '==', createdByName).get();
    if (usersSnapshot.empty) {
      console.log(`❌ Usuário com nome '${createdByName}' não encontrado para tarefa ${taskDoc.id}`);
      skippedCount++;
      continue;
    }
    const user = usersSnapshot.docs[0].data();
    const photoURL = user.photoURL || null;

    // Atualizar tarefa
    await taskDoc.ref.update({ createdByPhotoURL: photoURL });
    console.log(`✅ Tarefa ${taskDoc.id} atualizada com foto de perfil de '${createdByName}'.`);
    updatedCount++;
  }

  console.log('\n📈 Resumo da operação:');
  console.log(`✅ Tarefas atualizadas: ${updatedCount}`);
  console.log(`⏭️ Tarefas ignoradas: ${skippedCount}`);
  console.log(`📊 Total processado: ${tasksSnapshot.docs.length}`);
}

updateTasksWithPhotoURL()
  .then(() => {
    console.log('\n🎉 Operação concluída com sucesso!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro ao atualizar tarefas:', err);
    process.exit(1);
  }); 