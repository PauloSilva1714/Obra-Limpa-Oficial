import { registerRootComponent } from 'expo';
import { App } from '../app/_layout';

// Função para garantir que o elemento root existe
function ensureRootElement() {
  return new Promise((resolve) => {
    const checkRoot = () => {
      let rootElement = document.getElementById('root');
      
      if (!rootElement) {
        rootElement = document.createElement('div');
        rootElement.id = 'root';
        document.body.appendChild(rootElement);
      }
      
      resolve(rootElement);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkRoot);
    } else {
      checkRoot();
    }
  });
}

// Aguardar o elemento root estar disponível antes de registrar o componente
ensureRootElement().then(() => {
  registerRootComponent(App);
}).catch((error) => {
  console.error('Erro ao garantir elemento root:', error);
  // Tentar registrar mesmo assim como fallback
  registerRootComponent(App);
});