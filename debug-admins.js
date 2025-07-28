// Script de debug para verificar administradores no Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

// Configuração do Firebase (substitua pelos seus dados)
const firebaseConfig = {
  // Adicione sua configuração aqui
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugAdmins() {
  try {
    console.log('=== DEBUG ADMINISTRADORES ===');
    
    // 1. Buscar todos os usuários
    console.log('\n1. Buscando todos os usuários...');
    const allUsersQuery = query(collection(db, 'users'));
    const allUsersSnapshot = await getDocs(allUsersQuery);
    console.log(`Total de usuários: ${allUsersSnapshot.docs.length}`);
    
    allUsersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name} (${data.email}) - Role: ${data.role} - Sites: ${JSON.stringify(data.sites)}`);
    });
    
    // 2. Buscar apenas administradores
    console.log('\n2. Buscando apenas administradores...');
    const adminsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );
    const adminsSnapshot = await getDocs(adminsQuery);
    console.log(`Total de administradores: ${adminsSnapshot.docs.length}`);
    
    adminsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name} (${data.email}) - Sites: ${JSON.stringify(data.sites)}`);
    });
    
    // 3. Buscar todas as obras
    console.log('\n3. Buscando todas as obras...');
    const sitesQuery = query(collection(db, 'sites'));
    const sitesSnapshot = await getDocs(sitesQuery);
    console.log(`Total de obras: ${sitesSnapshot.docs.length}`);
    
    sitesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name} (ID: ${doc.id})`);
    });
    
    // 4. Para cada obra, buscar administradores
    console.log('\n4. Buscando administradores por obra...');
    for (const siteDoc of sitesSnapshot.docs) {
      const siteId = siteDoc.id;
      const siteName = siteDoc.data().name;
      
      console.log(`\nObra: ${siteName} (${siteId})`);
      
      const siteAdminsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin'),
        where('sites', 'array-contains', siteId)
      );
      
      const siteAdminsSnapshot = await getDocs(siteAdminsQuery);
      console.log(`  Administradores: ${siteAdminsSnapshot.docs.length}`);
      
      siteAdminsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`    - ${data.name} (${data.email})`);
      });
    }
    
  } catch (error) {
    console.error('Erro no debug:', error);
  }
}

// Executar o debug
debugAdmins();