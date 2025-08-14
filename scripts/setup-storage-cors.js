const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Verificar se o arquivo storage.cors.json existe
  const storageCorsFilePath = path.join(__dirname, '..', 'storage.cors.json');
  if (!fs.existsSync(storageCorsFilePath)) {
    console.error('❌ Arquivo storage.cors.json não encontrado!');
    process.exit(1);
  }

  // Verificar se o arquivo cors.json existe
  const corsFilePath = path.join(__dirname, '..', 'cors.json');
  if (!fs.existsSync(corsFilePath)) {
    console.error('❌ Arquivo cors.json não encontrado!');
    process.exit(1);
  }

  // Aplicar configuração CORS para Storage
  console.log('📦 Configurando CORS para Firebase Storage...');
  execSync('gsutil cors set storage.cors.json gs://bralimpa2.firebasestorage.app', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('✅ CORS configurado com sucesso para Firebase Storage!');

  // Aplicar configuração CORS para Functions/API
  console.log('🔧 Configurando CORS para Firebase Functions/API...');
  // Aqui você pode adicionar o comando para configurar CORS para Functions se necessário
  // Por exemplo, se estiver usando Firebase Functions com Express
  console.log('ℹ️ O arquivo cors.json está configurado e pronto para uso nas Functions.');

} catch (error) {
  console.error('❌ Erro ao configurar CORS:', error.message);
}