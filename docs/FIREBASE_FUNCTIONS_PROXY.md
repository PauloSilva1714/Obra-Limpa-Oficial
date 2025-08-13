# 🔥 Firebase Functions como Proxy para Google Places API

## 📋 Visão Geral

O Firebase Functions oferece a melhor solução para resolver problemas de CORS com a API do Google Places. Ele atua como um proxy seguro entre seu frontend e a API do Google, eliminando restrições de CORS e protegendo sua chave de API.

## 🎯 Por que usar Firebase Functions?

### ✅ Vantagens:
- **Sem CORS**: Executa no servidor, não no navegador
- **Segurança**: Chave da API fica protegida no servidor
- **Escalabilidade**: Escala automaticamente com o Firebase
- **Integração**: Já integrado ao seu projeto Firebase
- **Custo**: Plano gratuito generoso para a maioria dos casos

### ❌ Problemas que resolve:
- Erro de CORS ao chamar Google Places API diretamente
- Exposição da chave da API no frontend
- Limitações de domínio da API do Google

## 🏗️ Implementação Atual

Seu projeto **já possui** uma implementação funcional do proxy! Vamos analisar:

### 📁 Estrutura Existente

```
functions/
├── src/
│   └── index.ts          # Contém googlePlacesProxy
├── package.json           # Dependências
└── tsconfig.json         # Configuração TypeScript
```

### 🔧 Função Proxy Existente

Em `functions/src/index.ts`, você já tem:

```typescript
export const googlePlacesProxy = functions.https.onRequest(async (request, response) => {
  corsHandler(request, response, async () => {
    const { endpoint, ...queryParams } = request.query;

    if (!endpoint || typeof endpoint !== 'string') {
      response.status(400).send('Endpoint is required');
      return;
    }

    const apiKey = queryParams.key;
    if (!apiKey) {
      response.status(400).send('API key is required');
      return;
    }

    let apiBaseUrl = 'https://maps.googleapis.com/maps/api/place';
    let endpointPath = `/${endpoint}/json`;

    if (endpoint === 'geocode') {
      apiBaseUrl = 'https://maps.googleapis.com/maps/api/geocode';
      endpointPath = '/json';
      delete queryParams.endpoint;
    }

    const apiUrl = `${apiBaseUrl}${endpointPath}`;
    const url = new URL(apiUrl);
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        url.searchParams.append(key, value);
      }
    });

    url.searchParams.append('key', apiKey as string);

    try {
      const apiResponse = await fetch(url.toString());
      const data = await apiResponse.json();
      response.status(apiResponse.status).json(data);
    } catch (error) {
      response.status(500).send('Internal Server Error');
    }
  });
});
```

## 🚀 Como Funciona

### 1. **Fluxo de Requisição**
```
Frontend → Firebase Function → Google Places API → Firebase Function → Frontend
```

### 2. **Endpoints Suportados**
- `autocomplete` - Busca de endereços
- `details` - Detalhes de um local
- `geocode` - Geocodificação

### 3. **Exemplo de Uso**

**URL da Function:**
```
https://us-central1-[SEU-PROJECT-ID].cloudfunctions.net/googlePlacesProxy
```

**Chamada para Autocomplete:**
```
GET https://us-central1-[SEU-PROJECT-ID].cloudfunctions.net/googlePlacesProxy?endpoint=autocomplete&input=Rua+Augusta&key=[SUA-API-KEY]
```

## 🔧 Configuração e Deploy

### 1. **Instalar Dependências**
```bash
cd functions
npm install
```

### 2. **Fazer Deploy**
```bash
firebase deploy --only functions
```

### 3. **Verificar Deploy**
Após o deploy, você receberá a URL da function:
```
✔ functions[us-central1-googlePlacesProxy]: Successful create operation.
Function URL (googlePlacesProxy): https://us-central1-[PROJECT-ID].cloudfunctions.net/googlePlacesProxy
```

## 🔄 Modificar o Frontend

### 1. **Atualizar config/google-places.ts**

Substitua as chamadas diretas pela function:

```typescript
// Configuração da Firebase Function
const FIREBASE_FUNCTION_URL = 'https://us-central1-[SEU-PROJECT-ID].cloudfunctions.net/googlePlacesProxy';

// Função para obter URL da Firebase Function
export const getPlacesApiUrl = (endpoint: string, params: Record<string, string>): string => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  const url = new URL(FIREBASE_FUNCTION_URL);
  
  // Adicionar endpoint
  url.searchParams.append('endpoint', endpoint);
  
  // Adicionar parâmetros
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Adicionar chave da API
  url.searchParams.append('key', apiKey);
  
  return url.toString();
};

export const getGeocodingApiUrl = (params: Record<string, string>): string => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  const url = new URL(FIREBASE_FUNCTION_URL);
  
  // Para geocoding, usar endpoint 'geocode'
  url.searchParams.append('endpoint', 'geocode');
  
  // Adicionar parâmetros
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Adicionar chave da API
  url.searchParams.append('key', apiKey);
  
  return url.toString();
};
```

### 2. **Obter o Project ID**

Para encontrar seu Project ID:

```bash
firebase projects:list
```

Ou verifique em `.firebaserc`:
```json
{
  "projects": {
    "default": "seu-project-id"
  }
}
```

## 🔐 Segurança Avançada

### 1. **Proteger a Chave da API**

Em vez de passar a chave via parâmetro, configure-a no Firebase:

```bash
firebase functions:config:set google.places_api_key="SUA_CHAVE_AQUI"
```

E modifique a function:

```typescript
export const googlePlacesProxy = functions.https.onRequest(async (request, response) => {
  corsHandler(request, response, async () => {
    const { endpoint, ...queryParams } = request.query;

    // Usar chave do config em vez do parâmetro
    const apiKey = functions.config().google.places_api_key;
    
    if (!apiKey) {
      response.status(500).send('API key not configured');
      return;
    }

    // Remover key dos queryParams se existir
    delete queryParams.key;

    // ... resto da implementação
  });
});
```

### 2. **Validação de Origem**

```typescript
// Adicionar validação de origem
const allowedOrigins = [
  'https://obra-limpa.expo.app',
  'http://localhost:8081',
  'exp://192.168.1.100:8081' // Para desenvolvimento
];

const origin = request.headers.origin;
if (origin && !allowedOrigins.includes(origin)) {
  response.status(403).send('Origin not allowed');
  return;
}
```

## 📊 Monitoramento

### 1. **Logs da Function**
```bash
firebase functions:log --only googlePlacesProxy
```

### 2. **Console do Firebase**
- Acesse: https://console.firebase.google.com
- Vá em "Functions" para ver métricas
- Monitore invocações, erros e latência

## 💰 Custos

### Firebase Functions (Plano Spark - Gratuito):
- **2 milhões de invocações/mês**
- **400.000 GB-segundos/mês**
- **200.000 CPU-segundos/mês**

### Google Places API:
- **Autocomplete**: $0.00283 por requisição
- **Place Details**: $0.017 per requisição
- **Geocoding**: $0.005 por requisição

## 🚨 Troubleshooting

### 1. **Function não encontrada**
```bash
# Verificar se foi deployada
firebase functions:list

# Re-deploy se necessário
firebase deploy --only functions
```

### 2. **Erro de CORS ainda persiste**
- Verifique se está usando a URL correta da function
- Confirme que o CORS está configurado na function

### 3. **API Key inválida**
- Verifique se a chave está correta
- Confirme se a API está habilitada no Google Cloud Console

### 4. **Timeout**
- Aumente o timeout da function se necessário:
```typescript
export const googlePlacesProxy = functions
  .runWith({ timeoutSeconds: 60 })
  .https.onRequest(/* ... */);
```

## 🎯 Próximos Passos

1. **Deploy da Function** (se ainda não foi feito)
2. **Atualizar Frontend** para usar a function
3. **Testar** a integração
4. **Configurar Segurança** avançada
5. **Monitorar** uso e performance

## 📚 Recursos Adicionais

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [CORS em Firebase Functions](https://firebase.google.com/docs/functions/http-events#cors)

---

**✅ Sua implementação já está pronta! Basta fazer o deploy e atualizar o frontend para usar a Firebase Function como proxy.**