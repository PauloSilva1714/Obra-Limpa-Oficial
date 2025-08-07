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

    // Remover console.log e variações
    let newContent = content
      // Remover console.log simples
      .replace(/console\.log\([^)]*\);?\s*/g, '')
      .replace(/console\.warn\([^)]*\);?\s*/g, '')
      .replace(/console\.error\([^)]*\);?\s*/g, '')
      .replace(/console\.info\([^)]*\);?\s*/g, '')
      .replace(/console\.debug\([^)]*\);?\s*/g, '')

      // Remover console.log com template literals
      .replace(/console\.log\(`[^`]*`\);?\s*/g, '')
      .replace(/console\.warn\(`[^`]*`\);?\s*/g, '')
      .replace(/console\.error\(`[^`]*`\);?\s*/g, '')
      .replace(/console\.info\(`[^`]*`\);?\s*/g, '')
      .replace(/console\.debug\(`[^`]*`\);?\s*/g, '')

      // Remover console.log com múltiplos argumentos
      .replace(/console\.log\([^)]*,[^)]*\);?\s*/g, '')
      .replace(/console\.warn\([^)]*,[^)]*\);?\s*/g, '')
      .replace(/console\.error\([^)]*,[^)]*\);?\s*/g, '')
      .replace(/console\.info\([^)]*,[^)]*\);?\s*/g, '')
      .replace(/console\.debug\([^)]*,[^)]*\);?\s*/g, '')

      // Remover console.log comentados
      .replace(/\/\/\s*console\.log\([^)]*\);?\s*/g, '')
      .replace(/\/\/\s*console\.warn\([^)]*\);?\s*/g, '')
      .replace(/\/\/\s*console\.error\([^)]*\);?\s*/g, '')
      .replace(/\/\/\s*console\.info\([^)]*\);?\s*/g, '')
      .replace(/\/\/\s*console\.debug\([^)]*\);?\s*/g, '')

      // Remover console.log em blocos comentados
      .replace(/\/\*[\s\S]*?console\.log\([^)]*\);?[\s\S]*?\*\//g, '')
      .replace(/\/\*[\s\S]*?console\.warn\([^)]*\);?[\s\S]*?\*\//g, '')
      .replace(/\/\*[\s\S]*?console\.error\([^)]*\);?[\s\S]*?\*\//g, '')
      .replace(/\/\*[\s\S]*?console\.info\([^)]*\);?[\s\S]*?\*\//g, '')
      .replace(/\/\*[\s\S]*?console\.debug\([^)]*\);?[\s\S]*?\*\//g, '')

      // Remover linhas vazias extras
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s*\n/g, '')
      .replace(/\n\s*$/g, '\n');

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
const startTime = Date.now();
walkDirectory('.');

const endTime = Date.now();
const duration = (endTime - startTime) / 1000;

console.log('\n📊 Resumo da Limpeza:');
console.log(`📁 Arquivos processados: ${filesProcessed}`);
console.log(`🗑️ Logs removidos: ${totalLogsRemoved}`);
console.log(`⏱️ Tempo de execução: ${duration.toFixed(2)}s`);

if (totalLogsRemoved > 0) {
  console.log('\n✅ Console.log removidos com sucesso!');
  console.log('🚀 Seu app está pronto para produção!');
  console.log('\n💡 Dica: Execute este script antes de cada build de produção.');
} else {
  console.log('\nℹ️ Nenhum console.log encontrado.');
  console.log('🎉 Seu código já está limpo!');
}
