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