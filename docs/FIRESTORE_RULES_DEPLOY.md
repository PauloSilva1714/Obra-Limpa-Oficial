# Deploy das Regras do Firestore

## Problema Identificado

O erro `FirebaseError: Missing or insufficient permissions` no `AdminService.getNotifications()` ocorre porque as regras do Firestore não incluem permissões para a coleção `adminNotifications`.

## Solução Implementada

### 1. Regras Adicionadas ao firestore.rules

```javascript
// Regras para notificações administrativas
match /adminNotifications/{notificationId} {
  allow read, list: if isAuthenticated() && (
    isAdmin() && request.auth.uid == resource.data.recipientId
  );
  allow create: if isAuthenticated() && isAdmin();
  allow update: if isAuthenticated() && isAdmin() && (
    request.auth.uid == resource.data.recipientId ||
    request.auth.uid == resource.data.senderId
  );
  allow delete: if isAuthenticated() && isAdmin();
}

// Regras para atividades administrativas
match /adminActivities/{activityId} {
  allow read, list: if isAuthenticated() && isAdmin();
  allow create: if isAuthenticated() && isAdmin();
  allow update, delete: if isAuthenticated() && isAdmin();
}
```

### 2. Melhorias no Código

- Adicionada verificação de role de admin no `getNotifications()`
- Melhor tratamento de erros de permissão
- Supressão de avisos de permissão durante desenvolvimento

## Como Fazer o Deploy Manual

### Opção 1: Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para **Firestore Database** > **Rules**
4. Copie o conteúdo do arquivo `firestore.rules` 
5. Cole no editor online
6. Clique em **Publish**

### Opção 2: Firebase CLI

Se o Firebase CLI estiver configurado:

```bash
# Instalar/atualizar Firebase CLI
npm install -g firebase-tools

# Fazer login
firebase login

# Fazer deploy das regras
firebase deploy --only firestore:rules
```

### Opção 3: Verificar Projeto Atual

```bash
# Verificar qual projeto está ativo
firebase projects:list

# Selecionar projeto correto
firebase use [PROJECT_ID]

# Fazer deploy
firebase deploy --only firestore:rules
```

## Verificação

Após o deploy das regras:

1. O erro de permissões deve desaparecer
2. As notificações administrativas funcionarão corretamente
3. O console ficará limpo de erros de Firebase

## Estrutura das Coleções

### adminNotifications
- `recipientId`: ID do usuário que receberá a notificação
- `senderId`: ID do usuário que enviou
- `senderName`: Nome do remetente
- `type`: Tipo da notificação
- `title`: Título
- `message`: Mensagem
- `read`: Boolean indicando se foi lida
- `createdAt`: Data de criação
- `actionUrl`: URL de ação (opcional)

### adminActivities
- `siteId`: ID da obra
- `adminId`: ID do administrador
- `adminName`: Nome do administrador
- `action`: Ação realizada
- `details`: Detalhes da ação
- `timestamp`: Data/hora da ação

## Status Atual

✅ Regras adicionadas ao arquivo `firestore.rules`
✅ Código melhorado para tratar erros de permissão
✅ Avisos suprimidos durante desenvolvimento
⚠️ **PENDENTE**: Deploy das regras no Firebase Console

**Próximo passo**: Fazer o deploy manual das regras através do Firebase Console.