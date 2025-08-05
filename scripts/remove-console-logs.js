const fs = require('fs');
const path = require('path');

// Diretórios para ignorar
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'android',
  'ios',
  'web',
  'builds',
  'dist',
  '.expo',
  'scripts'
];

// Extensões de arquivo para processar
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Contador de logs removidos
let totalLogsRemoved = 0;
let filesProcessed = 0;

function shouldIgnoreDirectory(dirPath) {
  return IGNORE_DIRS.some(ignoreDir =>
    dirPath.includes(ignoreDir)
  );
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remover console.log, console.warn, console.error, console.info
    let newContent = content
      .replace(/console\.log\([^)]*\);?\s*/g, '')
      .replace(/console\.warn\([^)]*\);?\s*/g, '')
      .replace(/console\.error\([^)]*\);?\s*/g, '')
      .replace(/console\.info\([^)]*\);?\s*/g, '')
      .replace(/console\.debug\([^)]*\);?\s*/g, '');

    // Remover linhas vazias extras
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      const logsRemoved = (originalContent.match(/console\.(log|warn|error|info|debug)/g) || []).length;
      totalLogsRemoved += logsRemoved;
      console.log(`✅ ${filePath}: ${logsRemoved} logs removidos`);
    }

    filesProcessed++;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!shouldIgnoreDirectory(fullPath)) {
        walkDirectory(fullPath);
      }
    } else if (FILE_EXTENSIONS.includes(path.extname(item))) {
      processFile(fullPath);
    }
  }
}

// Iniciar processamento
console.log('🧹 Iniciando remoção de console.log...\n');

const startTime = Date.now();
walkDirectory('.');

const endTime = Date.now();
const duration = (endTime - startTime) / 1000;

console.log('\n📊 Resumo:');
console.log(`📁 Arquivos processados: ${filesProcessed}`);
console.log(`🗑️ Logs removidos: ${totalLogsRemoved}`);
console.log(`⏱️ Tempo de execução: ${duration.toFixed(2)}s`);

if (totalLogsRemoved > 0) {
  console.log('\n✅ Console.log removidos com sucesso!');
  console.log('🚀 Seu app está pronto para produção!');
} else {
  console.log('\nℹ️ Nenhum console.log encontrado.');
}
