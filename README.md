# Obra Limpa

## Descrição
Aplicativo para gestão de obras, tarefas, equipes e comunicação em tempo real.

## Como rodar o projeto

### Mobile (Expo)
```bash
npm install
expo start
```

### Web (Vite)
```bash
cd web
npm install
npm run dev
```

## Variáveis de ambiente
- `.env` (raiz): para Expo/React Native
- `web/.env`: para web (Vite)

## Build de produção

### Mobile
```bash
eas build --platform android
eas build --platform ios
```

### Web
```bash
cd web
npm run build
```

## Deploy
- Web: Vercel, Netlify, Firebase Hosting, etc.
- Mobile: Play Store, App Store

## Monitoramento
- Sentry (web)
- Crashlytics (mobile)

## Política de Privacidade e Termos de Uso
- [Política de Privacidade](POLITICA_PRIVACIDADE.md)
- [Termos de Uso](TERMOS_USO.md)

## Contato
- Seu email ou site 