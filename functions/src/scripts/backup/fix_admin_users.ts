import * as admin from 'firebase-admin';
import * as path from 'path';

// Inicializa o Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      path.resolve(__dirname, '../../serviceAccountKey.json')
    ),
  });
}

const db = admin.firestore();

async function fixAdminUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('role', '==', 'admin').get();

  let count = 0;
  for (const doc of snapshot.docs) {
    const user = doc.data();
    const userId = doc.id;
    let needsUpdate = false;
    let updates: any = {};

    // Corrigir se não tem campo sites ou está vazio
    if (!user.sites || !Array.isArray(user.sites) || user.sites.length === 0) {
      // Tentar recuperar o siteId do convite aceito
      if (user.inviteId) {
        const inviteSnap = await db.collection('invites').doc(user.inviteId).get();
        if (inviteSnap.exists) {
          const invite = inviteSnap.data();
          if (invite && invite.siteId) {
            updates.sites = [invite.siteId];
            needsUpdate = true;
          }
        }
      }
    }

    // Corrigir se não tem siteId (campo auxiliar)
    if ((!user.siteId || typeof user.siteId !== 'string') && updates.sites && updates.sites.length > 0) {
      updates.siteId = updates.sites[0];
      needsUpdate = true;
    }

    // Se só siteId está faltando, mas sites já existe
    if ((!user.siteId || typeof user.siteId !== 'string') && user.sites && user.sites.length > 0) {
      updates.siteId = user.sites[0];
      needsUpdate = true;
    }

    if (needsUpdate) {
      await usersRef.doc(userId).update(updates);
      count++;
    }
  }
}

fixAdminUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Erro ao corrigir usuários:', err);
    process.exit(1);
  }); 