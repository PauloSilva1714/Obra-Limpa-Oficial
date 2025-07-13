const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando CORS do Firebase Storage...');

try {
  // Verificar se o arquivo storage.cors.json existe
  const corsFilePath = path.join(__dirname, '..', 'storage.cors.json');
  if (!fs.existsSync(corsFilePath)) {
    console.error('❌ Arquivo storage.cors.json não encontrado!');
    process.exit(1);
  }

  // Aplicar configuração CORS
  console.log('📤 Aplicando configuração CORS...');
  execSync('gsutil cors set storage.cors.json gs://bralimpa2.firebasestorage.app', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('✅ Configuração CORS aplicada com sucesso!');
  console.log('🔄 Agora você pode fazer upload de imagens sem problemas de CORS.');
  
} catch (error) {
  console.error('❌ Erro ao configurar CORS:', error.message);
  console.log('💡 Certifique-se de que:');
  console.log('   1. Você tem o gsutil instalado');
  console.log('   2. Você está logado no Firebase (firebase login)');
  console.log('   3. O bucket do Storage está correto');
  
  console.log('\n🔧 Para instalar o gsutil:');
  console.log('   https://cloud.google.com/storage/docs/gsutil_install');
  
  console.log('\n🔧 Para fazer login no Firebase:');
  console.log('   firebase login');
} 