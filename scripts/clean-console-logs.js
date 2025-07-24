const fs = require('fs');
const path = require('path');

// Função para processar um arquivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove console.log mas mantém console.error, console.warn, console.info
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
      // Se a linha contém console.log (mas não console.error, console.warn, console.info)
      if (line.includes('console.log') && 
          !line.includes('console.error') && 
          !line.includes('console.warn') && 
          !line.includes('console.info')) {
        
        // Se a linha só tem console.log e espaços, remove completamente
        if (line.trim().match(/^console\.log\(.*\);?\s*$/)) {
          modified = true;
          return null; // Marca para remoção
        }
        
        // Se console.log está no meio de código, comenta
        if (line.trim().length > 0) {
          modified = true;
          return line.replace(/console\.log\([^)]*\);?/g, '// console.log removed');
        }
      }
      return line;
    });
    
    if (modified) {
      // Remove linhas marcadas como null e linhas vazias consecutivas
      const finalLines = processedLines
        .filter(line => line !== null)
        .reduce((acc, line, index, array) => {
          // Evita múltiplas linhas vazias consecutivas
          if (line.trim() === '' && acc[acc.length - 1] === '') {
            return acc;
          }
          acc.push(line);
          return acc;
        }, []);
      
      const newContent = finalLines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Função para processar diretório recursivamente
function processDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let processedCount = 0;
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Pula node_modules, .git, etc.
        if (!['node_modules', '.git', '.expo', 'dist', 'build'].includes(item)) {
          walkDir(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (extensions.includes(ext)) {
          if (processFile(fullPath)) {
            processedCount++;
          }
        }
      }
    }
  }
  
  walkDir(dirPath);
  return processedCount;
}

// Executa o script
const projectRoot = process.cwd();

const processedCount = processDirectory(projectRoot);

console.log('🔍 Console.error, console.warn e console.info foram mantidos');