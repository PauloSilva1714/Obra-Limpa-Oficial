# Índices do Firestore - Solução de Problemas

## Problema

Quando você executa consultas compostas no Firestore (que combinam filtros `where` com ordenação `orderBy`), o Firebase pode retornar um erro solicitando a criação de um índice composto.

### Exemplo de Erro:
```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/bralimpa2/firestore/indexes/...
```

## Solução

### 1. Deploy dos Índices

Execute o comando para fazer o deploy dos índices:

```bash
npm run deploy:indexes
```

Ou use o comando direto do Firebase:

```bash
firebase deploy --only firestore:indexes
```

### 2. Índices Configurados

Os seguintes índices foram configurados no arquivo `firestore.indexes.json`:

#### adminMessages
- `siteId` (ASC) + `createdAt` (DESC)

#### adminNotifications  
- `recipientId` (ASC) + `createdAt` (DESC)

#### adminActivities
- `siteId` (ASC) + `timestamp` (DESC)

#### tasks
- `siteId` (ASC) + `createdAt` (DESC)
- `siteId` (ASC) + `status` (ASC) + `createdAt` (DESC)
- `siteId` (ASC) + `assignedTo` (ASC) + `createdAt` (DESC)
- `siteId` (ASC) + `priority` (ASC) + `createdAt` (DESC)
- `siteId` (ASC) + `category` (ASC) + `createdAt` (DESC)

#### taskProgress
- `taskId` (ASC) + `createdAt` (DESC)

#### taskComments
- `taskId` (ASC) + `createdAt` (DESC)

### 3. Verificação do Status

Após o deploy, você pode verificar o status dos índices no console do Firebase:

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá para **Firestore Database**
4. Clique na aba **Índices**
5. Verifique se todos os índices estão com status "Ativo"

### 4. Tempo de Criação

Os índices podem levar alguns minutos para serem criados. Durante esse período, as consultas podem continuar falhando. Aguarde até que todos os índices estejam ativos.

### 5. Comandos Úteis

```bash
# Deploy apenas dos índices
npm run deploy:indexes

# Deploy apenas das regras
npm run deploy:rules

# Deploy completo do Firestore (índices + regras)
npm run deploy:firestore

# Verificar status do projeto
firebase projects:list

# Verificar configuração atual
firebase use
```

### 6. Adicionando Novos Índices

Se você adicionar novas consultas compostas no código, adicione os índices correspondentes no arquivo `firestore.indexes.json` e execute o deploy novamente.

### 7. Troubleshooting

Se os índices não estiverem sendo criados:

1. Verifique se você está logado no Firebase CLI:
   ```bash
   firebase login
   ```

2. Verifique se está no projeto correto:
   ```bash
   firebase use
   ```

3. Verifique se o arquivo `firestore.indexes.json` está na raiz do projeto

4. Execute o deploy com verbose para mais detalhes:
   ```bash
   firebase deploy --only firestore:indexes --debug
   ``` 