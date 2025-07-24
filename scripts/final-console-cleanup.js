const fs = require('fs');
const path = require('path');

// Função para processar um arquivo de forma mais robusta
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Padrões mais específicos para console.log
    const patterns = [
      // console.log simples
      /^\s*console\.log\([^)]*\);\s*$/gm,
      // console.log no meio de linha
      /console\.log\([^)]*\);?/g,
      // console.log multiline
      /console\.log\(\s*[\s\S]*?\);\s*$/gm
    ];
    
    let newContent = content;
    
    patterns.forEach(pattern => {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, (match) => {
          // Se é uma linha inteira, remove completamente
          if (match.trim().match(/^console\.log\([\s\S]*\);?\s*$/)) {
            modified = true;
            return '';
          }
          // Se está no meio de código, comenta
          modified = true;
          return '// console.log removed';
        });
      }
    });
    
    // Remove linhas vazias excessivas
    if (modified) {
      newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Processado: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Lista de arquivos específicos que ainda têm console.log
const filesToProcess = [
  'components/TaskModal.tsx',
  'services/AdminService.ts',
  'services/adminservice.ts',
  'app/(tabs)/index.tsx',
  'services/ProgressService.ts',
  'services/TaskService.ts',
  'services/AuthService.ts',
  'config/firebase.ts'
];

console.log('🧹 Limpeza final de console.log...');

let processedCount = 0;
const projectRoot = process.cwd();

filesToProcess.forEach(relativePath => {
  const fullPath = path.join(projectRoot, relativePath);
  if (fs.existsSync(fullPath)) {
    if (processFile(fullPath)) {
      processedCount++;
    }
  } else {
    console.log(`⚠️ Arquivo não encontrado: ${relativePath}`);
  }
});

console.log(`\n✨ Limpeza final concluída!`);
console.log(`📊 Arquivos processados: ${processedCount}`);