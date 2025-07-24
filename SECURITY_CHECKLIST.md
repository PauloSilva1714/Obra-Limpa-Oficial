# 🔐 Checklist de Segurança - Obra Limpa

## ✅ IMPLEMENTADO

### API Keys e Credenciais
- [x] API Keys movidas para variáveis de ambiente (.env)
- [x] Firebase config usando process.env
- [x] Google Places API key protegida
- [x] .env adicionado ao .gitignore

### Logs e Debug
- [x] Console.logs removidos em produção (babel config)
- [x] Apenas console.error mantido para debugging crítico
- [x] Debug statements removidos

### Build e Deploy
- [x] EAS Build configurado com perfis de produção
- [x] NODE_ENV=production configurado
- [x] Build otimizado para produção

## ⚠️ AÇÕES NECESSÁRIAS

### Antes do Deploy
1. **Regenerar API Keys**
   - Criar novas chaves Firebase para produção
   - Criar nova chave Google Places para produção
   - Configurar restrições de domínio/IP

2. **Configurar EAS Secrets**
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "nova_chave"
   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_PLACES_API_KEY --value "nova_chave"
   ```

3. **Firestore Security Rules**
   - Revisar regras de segurança
   - Testar em ambiente de produção
   - Configurar índices necessários

4. **Firebase Storage CORS**
   - Configurar CORS para domínio de produção
   - Testar upload de imagens

### Monitoramento
1. **Configurar Sentry/Crashlytics**
2. **Configurar Analytics**
3. **Configurar alertas de erro**

## 🚨 NUNCA FAZER

- ❌ Commitar API keys no código
- ❌ Usar chaves de desenvolvimento em produção
- ❌ Deixar console.logs em produção
- ❌ Fazer deploy sem testar em dispositivos reais
- ❌ Usar credenciais compartilhadas

## 📋 Checklist Final

Antes de publicar:
- [ ] Todas as API keys estão em variáveis de ambiente
- [ ] Build de produção testado
- [ ] Performance testada em dispositivos reais
- [ ] Firestore rules configuradas
- [ ] Política de privacidade criada
- [ ] Termos de uso criados
- [ ] Screenshots das lojas preparados