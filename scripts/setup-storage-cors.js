const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Verificar se o arquivo storage.cors.json existe
  const corsFilePath = path.join(__dirname, '..', 'storage.cors.json');
  if (!fs.existsSync(corsFilePath)) {
    console.error('❌ Arquivo storage.cors.json não encontrado!');
    process.exit(1);
  }

  // Aplicar configuração CORS
  execSync('gsutil cors set storage.cors.json gs://bralimpa2.firebasestorage.app', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

} catch (error) {
  console.error('❌ Erro ao configurar CORS:', error.message);
  
  
} 