# 🗺️ Configuração do Google Places API

Este guia explica como configurar o Google Places API para o sistema de busca de endereços.

## 📋 Pré-requisitos

1. Conta Google
2. Projeto no Google Cloud Console
3. Cartão de crédito (para cobrança da API)

## 🚀 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Selecionar projeto" → "Novo projeto"
3. Digite um nome para o projeto (ex: "obra-limpa-app")
4. Clique em "Criar"

### 2. Habilitar APIs Necessárias

No seu projeto, habilite as seguintes APIs:

1. **Places API**
   - Vá para "APIs e serviços" → "Biblioteca"
   - Procure por "Places API"
   - Clique em "Habilitar"

2. **Geocoding API**
   - Procure por "Geocoding API"
   - Clique em "Habilitar"

3. **Maps JavaScript API** (opcional, para futuras funcionalidades)
   - Procure por "Maps JavaScript API"
   - Clique em "Habilitar"

### 3. Criar Chave da API

1. Vá para "APIs e serviços" → "Credenciais"
2. Clique em "Criar credenciais" → "Chave da API"
3. Copie a chave gerada

### 4. Configurar Restrições da Chave (Recomendado)

1. Clique na chave criada
2. Em "Restrições de aplicativo", selecione:
   - **APIs**: Places API, Geocoding API
   - **Restrições de HTTP**: Adicione os domínios do seu app
3. Clique em "Salvar"

### 5. Configurar Cobrança

1. Vá para "Faturamento"
2. Vincule uma conta de cobrança ao projeto
3. Configure alertas de orçamento (recomendado)

## 💰 Custos

O Google Places API tem os seguintes custos (preços aproximados):

- **Autocomplete**: $2.83 por 1000 requisições
- **Place Details**: $17 por 1000 requisições
- **Geocoding**: $5 por 1000 requisições

**Estimativa para 1000 usuários/mês:**
- ~$10-50 dependendo do uso

## 🔧 Configuração no App

### 1. Atualizar Chave da API

Edite o arquivo `config/google-places.ts`:

```typescript
export const GOOGLE_PLACES_CONFIG = {
  API_KEY: 'AIzaSyBer6x1O4RAlrkHw8HYhh-lRgrbKlnocEA', // Substitua pela sua chave real
  // ... resto da configuração
};
```

### 2. Variáveis de Ambiente (Recomendado)

Para maior segurança, use variáveis de ambiente:

1. Crie um arquivo `.env`:
```env
GOOGLE_PLACES_API_KEY=sua_chave_aqui
```

2. Instale o pacote:
```bash
npm install react-native-dotenv
```

3. Configure no `babel.config.js`:
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
    ],
  };
};
```

4. Atualize o arquivo de configuração:
```typescript
import { GOOGLE_PLACES_API_KEY } from '@env';

export const GOOGLE_PLACES_CONFIG = {
  API_KEY: GOOGLE_PLACES_API_KEY,
  // ... resto da configuração
};
```

### 3. Adicionar ao .gitignore

```gitignore
# Google Places API
.env
config/google-places.ts
```

## 🧪 Testando a Configuração

1. Execute o app
2. Vá para a tela de cadastro
3. Clique no campo de endereço
4. Digite um endereço
5. Verifique se os resultados aparecem

## 🔒 Segurança

### Boas Práticas:

1. **Nunca commite a chave da API** no repositório
2. **Use restrições** na chave da API
3. **Configure alertas** de orçamento
4. **Monitore o uso** da API regularmente
5. **Use variáveis de ambiente** em produção

### Restrições Recomendadas:

- **APIs**: Apenas as necessárias
- **HTTP**: Domínios específicos do seu app
- **Android**: Package name do seu app
- **iOS**: Bundle ID do seu app

## 🚨 Solução de Problemas

### Erro: "API key not valid"
- Verifique se a chave está correta
- Confirme se as APIs estão habilitadas
- Verifique as restrições da chave

### Erro: "Quota exceeded"
- Verifique o uso no Google Cloud Console
- Configure alertas de orçamento
- Considere otimizar as requisições

### Erro: "Request denied"
- Verifique as restrições da chave
- Confirme se o domínio está permitido
- Verifique se a API está habilitada

## 📱 Configuração para Produção

### Android

1. Adicione no `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="sua_chave_aqui" />
```

### iOS

1. Adicione no `ios/YourApp/Info.plist`:
```xml
<key>GMSApiKey</key>
<string>sua_chave_aqui</string>
```

## 🔄 Atualizações

Para atualizar a chave da API:

1. Gere uma nova chave no Google Cloud Console
2. Atualize a configuração no app
3. Teste a funcionalidade
4. Remova a chave antiga após confirmar que tudo funciona

## 📞 Suporte

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-places-api)

## Configuração Inicial

1. **Criar projeto no Google Cloud Console**
   - Acesse [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um novo projeto ou selecione um existente
   - Ative as APIs necessárias:
     - Places API
     - Geocoding API
     - Maps JavaScript API

2. **Criar chave da API**
   - Vá para "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "API Key"
   - Copie a chave gerada

3. **Configurar restrições da chave**
   - Clique na chave criada para editar
   - Em "Application restrictions", selecione "HTTP referrers (web sites)"
   - Adicione os domínios permitidos:
     - Para desenvolvimento: `localhost:8083`, `localhost:3000`, `127.0.0.1:8083`
     - Para produção: `seudominio.com`, `*.seudominio.com`

## Problema de CORS

### O que é CORS?
CORS (Cross-Origin Resource Sharing) é uma política de segurança que impede requisições de um domínio para outro. No desenvolvimento web, isso pode bloquear chamadas para a API do Google Places.

### Soluções

#### 1. Para Desenvolvimento (Recomendado)
O código atual detecta automaticamente quando está rodando em `localhost` e usa dados simulados para evitar problemas de CORS:

```typescript
// Para desenvolvimento web, usar dados simulados para evitar CORS
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('Executando em localhost, usando dados simulados para evitar CORS');
  return this.getMockSearchResults(query);
}
```

#### 2. Para Produção
Configure corretamente as restrições da chave da API no Google Cloud Console:

1. **Adicione domínios específicos:**
   ```
   https://seudominio.com/*
   https://www.seudominio.com/*
   ```

2. **Para subdomínios:**
   ```
   https://*.seudominio.com/*
   ```

3. **Para desenvolvimento local (se necessário):**
   ```
   http://localhost:8083/*
   http://127.0.0.1:8083/*
   ```

#### 3. Usando Proxy (Alternativa)
Se precisar usar a API real em desenvolvimento, configure um proxy no seu servidor de desenvolvimento:

```javascript
// vite.config.js ou webpack.config.js
export default {
  server: {
    proxy: {
      '/api/places': {
        target: 'https://maps.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/places/, '/maps/api/place'),
      },
    },
  },
};
```

## Configuração no Projeto

1. **Arquivo de configuração:** `config/google-places.ts`
2. **Chave da API:** Substitua `YOUR_GOOGLE_PLACES_API_KEY` pela sua chave real
3. **Serviço:** `services/AddressService.ts`

## Testando

1. **Desenvolvimento:** Os dados simulados funcionam automaticamente
2. **Produção:** Teste com a chave real configurada
3. **Debug:** Verifique os logs no console para diagnosticar problemas

## Limites e Custos

- **Places API:** $17 por 1000 requisições
- **Geocoding API:** $5 por 1000 requisições
- **Limite gratuito:** 200 requisições por dia para cada API

## Troubleshooting

### Erro: "Access to fetch has been blocked by CORS policy"
- **Causa:** Domínio não autorizado na chave da API
- **Solução:** Adicione o domínio nas restrições da chave

### Erro: "API key not valid"
- **Causa:** Chave da API incorreta ou APIs não ativadas
- **Solução:** Verifique a chave e ative as APIs necessárias

### Erro: "Quota exceeded"
- **Causa:** Limite de requisições excedido
- **Solução:** Aguarde o reset diário ou configure billing

## Segurança

1. **Nunca exponha a chave da API no código cliente**
2. **Use restrições de domínio na chave**
3. **Configure limites de quota**
4. **Monitore o uso da API**

## Próximos Passos

1. Configure a chave da API para produção
2. Implemente cache de endereços para reduzir custos
3. Adicione tratamento de erros mais robusto
4. Implemente fallback para outros serviços de geocodificação 