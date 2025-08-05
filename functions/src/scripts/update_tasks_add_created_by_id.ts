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

async function updateTasksWithCreatedById() {
  const tasksSnapshot = await db.collection('tasks').get();

  let updatedCount = 0;
  let skippedCount = 0;

  for (const taskDoc of tasksSnapshot.docs) {
    const task = taskDoc.data();
    const createdByName = task.createdByName;

    if (!createdByName) {
      console.log(`Tarefa ${taskDoc.id}: Sem nome do criador, pulando...`);
      skippedCount++;
      continue;
    }

    try {
      // Buscar usuário pelo nome
      const usersSnapshot = await db.collection('users').where('name', '==', createdByName).get();

      if (usersSnapshot.empty) {
        console.log(`Tarefa ${taskDoc.id}: Usuário "${createdByName}" não encontrado, pulando...`);
        skippedCount++;
        continue;
      }

      const user = usersSnapshot.docs[0];
      const userId = user.id;

      // Atualizar tarefa com o ID do criador
      await taskDoc.ref.update({ createdById: userId });
      console.log(`Tarefa ${taskDoc.id}: Atualizada com createdById = ${userId}`);
      updatedCount++;

    } catch (error) {
      console.error(`Erro ao atualizar tarefa ${taskDoc.id}:`, error);
      skippedCount++;
    }
  }

  console.log(`\nResumo da atualização:`);
  console.log(`- Tarefas atualizadas: ${updatedCount}`);
  console.log(`- Tarefas puladas: ${skippedCount}`);
  console.log(`- Total processado: ${updatedCount + skippedCount}`);
}

updateTasksWithCreatedById()
  .then(() => {
    console.log('Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar script:', error);
    process.exit(1);
  });
