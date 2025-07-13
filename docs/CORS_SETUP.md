# 🔧 Configuração CORS - Firebase Storage

## Problema
Erro de CORS ao fazer upload de imagens para o Firebase Storage:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:8081' has been blocked by CORS policy
```

## Solução

### 1. Configuração Automática (Recomendado)

Execute o script de configuração:
```bash
npm run setup:cors
```

### 2. Configuração Manual

Se o script automático não funcionar, siga estes passos:

#### 2.1. Instalar Google Cloud SDK
- Baixe e instale o [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Inclui o `gsutil` necessário para configurar CORS

#### 2.2. Fazer Login no Firebase
```bash
firebase login
```

#### 2.3. Aplicar Configuração CORS
```bash
gsutil cors set storage.cors.json gs://bralimpa2.firebasestorage.app
```

### 3. Verificar Configuração

Para verificar se a configuração foi aplicada:
```bash
gsutil cors get gs://bralimpa2.firebasestorage.app
```

### 4. Arquivos de Configuração

#### storage.cors.json
```json
[
  {
    "origin": ["http://localhost:8081", "http://localhost:3000", "http://localhost:19006", "https://bralimpa2.firebaseapp.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]
```

#### storage.rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tasks/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /profiles/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Erro: "gsutil command not found"
- Instale o Google Cloud SDK
- Adicione o caminho do SDK ao PATH do sistema

### Erro: "Access denied"
- Verifique se está logado: `firebase login`
- Verifique se tem permissões no projeto

### Erro: "Bucket not found"
- Verifique se o nome do bucket está correto
- O bucket deve ser: `gs://bralimpa2.firebasestorage.app`

## Fallback Implementado

O código foi modificado para incluir um fallback em caso de erro de CORS:
- Se o upload falhar por CORS, usa URL local temporária
- Logs detalhados para debug
- Tratamento de erro robusto

## Teste

Após a configuração:
1. Reinicie o servidor de desenvolvimento
2. Tente fazer upload de uma imagem
3. Verifique os logs no console para confirmar o sucesso 