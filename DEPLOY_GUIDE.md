# 🚀 Guia de Deploy - Obra Limpa

## 📋 Checklist Pré-Deploy

### ✅ Segurança
- [x] API Keys movidas para variáveis de ambiente
- [x] Console.logs removidos em produção
- [x] Configuração de build otimizada
- [x] Babel configurado para produção

### 🔧 Configuração
- [x] EAS Build configurado
- [x] Scripts de build adicionados
- [x] App.config otimizado para produção
- [x] Ícones e splash screen configurados

## 🚀 Como Fazer Deploy

### 1. **Preparação**
```bash
# Instalar EAS CLI
npm install -g @expo/eas-cli

# Login no Expo
eas login

# Configurar projeto
eas build:configure
```

### 2. **Build de Teste**
```bash
# Build preview para teste
npm run preview
```

### 3. **Build de Produção**
```bash
# Android
npm run build:android

# iOS
npm run build:ios

# Ambos
npm run build:all
```

### 4. **Publicação**
```bash
# Publicar na Play Store/App Store
eas submit --platform android
eas submit --platform ios
```

## 🔐 Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis no EAS:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=sua_chave_aqui
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_dominio_aqui
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_aqui
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_bucket_aqui
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_aqui
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id_aqui
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=sua_chave_places_aqui
```

## 📱 Configuração das Lojas

### Google Play Store
1. Criar conta de desenvolvedor
2. Configurar app bundle
3. Adicionar screenshots
4. Configurar política de privacidade

### Apple App Store
1. Criar conta Apple Developer
2. Configurar App Store Connect
3. Adicionar screenshots
4. Configurar política de privacidade

## 🔍 Testes Finais

Antes do deploy, teste:
- [ ] Login/logout
- [ ] Criação de tarefas
- [ ] Upload de fotos
- [ ] Chat em tempo real
- [ ] Notificações
- [ ] Performance em dispositivos reais

## 📊 Monitoramento

Após o deploy, monitore:
- Crashes via Expo/Sentry
- Performance
- Feedback dos usuários
- Analytics de uso