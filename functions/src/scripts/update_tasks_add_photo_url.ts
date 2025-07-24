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
  const tasksSnapshot = await db.collection('tasks').get();

  let updatedCount = 0;
  let skippedCount = 0;

  for (const taskDoc of tasksSnapshot.docs) {
    const task = taskDoc.data();
    const createdByName = task.createdByName;
    if (!createdByName) {
      skippedCount++;
      continue;
    }

    // Buscar usuário pelo nome
    const usersSnapshot = await db.collection('users').where('name', '==', createdByName).get();
    if (usersSnapshot.empty) {
      skippedCount++;
      continue;
    }
    const user = usersSnapshot.docs[0].data();
    const photoURL = user.photoURL || null;

    // Atualizar tarefa
    await taskDoc.ref.update({ createdByPhotoURL: photoURL });
    updatedCount++;
  }

}

updateTasksWithPhotoURL()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro ao atualizar tarefas:', err);
    process.exit(1);
  }); 