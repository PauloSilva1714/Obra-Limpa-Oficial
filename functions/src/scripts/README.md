# Scripts utilitários Obra Limpa

## Corrigir administradores sem campo `sites` ou `siteId`

Este script corrige usuários administradores no Firestore que estejam sem o campo `sites` (array de obras) ou `siteId` (campo auxiliar), preenchendo corretamente a partir do convite aceito.

### Como rodar

1. Compile o projeto:

```bash
cd functions
npm run build
```

2. Execute o script (ajuste o caminho conforme necessário):

```bash
node lib/scripts/fix_admin_users.js
```

> **Atenção:**
> - O script atualiza apenas usuários com `role: "admin"`.
> - Ele só preenche `sites` e `siteId` se encontrar um convite aceito (`inviteId`) com `siteId` válido.
> - Faça um backup do Firestore antes de rodar em produção!

# Scripts de Atualização

Este diretório contém scripts para atualizar dados existentes no Firestore.

## Scripts Disponíveis

### update_tasks_add_photo_url.ts
Atualiza tarefas existentes adicionando a URL da foto do criador baseado no nome.

### update_tasks_add_created_by_id.ts
Atualiza tarefas existentes adicionando o ID do criador baseado no nome.

## Como Executar

1. Certifique-se de ter o arquivo `serviceAccountKey.json` na pasta `functions/`
2. Execute o script desejado:

```bash
cd functions
npx ts-node src/scripts/update_tasks_add_created_by_id.ts
```

## Observações

- Os scripts são executados uma única vez para atualizar dados existentes
- Sempre faça backup dos dados antes de executar scripts de atualização
- Verifique os logs para acompanhar o progresso da atualização
