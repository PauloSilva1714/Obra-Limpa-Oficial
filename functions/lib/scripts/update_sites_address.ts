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

async function updateSitesAddress() {
  const sitesSnapshot = await db.collection('sites').get();
  let count = 0;
  for (const doc of sitesSnapshot.docs) {
    const siteData = doc.data();
    if (!siteData.address || siteData.address.trim() === '') {
      // Defina aqui o endereço padrão ou personalize conforme necessário
      const novoEndereco = 'Rua Exemplo, 123 - Centro, Cidade/UF';
      await doc.ref.update({ address: novoEndereco });
      console.log(`Obra ${siteData.name} (${doc.id}) atualizada com endereço: ${novoEndereco}`);
      count++;
    }
  }
  console.log(`Total de obras atualizadas: ${count}`);
}

updateSitesAddress()
  .then(() => {
    console.log('Atualização de endereços concluída!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Erro ao atualizar endereços:', err);
    process.exit(1);
  }); 