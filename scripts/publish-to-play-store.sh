#!/bin/bash

# 🚀 Script de Publicação - Obra Limpa
# Este script automatiza o processo de publicação na Play Store

echo "🏗️ Iniciando processo de publicação do Obra Limpa..."

# 1. Verificar se o EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI não encontrado. Instalando..."
    npm install -g @expo/eas-cli
fi

# 2. Verificar se está logado no Expo
echo "🔐 Verificando login no Expo..."
if ! eas whoami &> /dev/null; then
    echo "❌ Não está logado no Expo. Faça login:"
    eas login
fi

# 3. Verificar se o projeto está configurado
echo "⚙️ Verificando configuração do projeto..."
if [ ! -f "eas.json" ]; then
    echo "❌ eas.json não encontrado. Configurando..."
    eas build:configure
fi

# 4. Atualizar version code
echo "📝 Atualizando version code..."

# Verificar se existe app.config.js
if [ -f "app.config.js" ]; then
    # Extrair o versionCode atual usando grep e regex
    CURRENT_VERSION=$(grep -oP 'versionCode:\s*\K\d+' app.config.js)
    
    if [ -n "$CURRENT_VERSION" ]; then
        NEW_VERSION=$((CURRENT_VERSION + 1))
        
        # Substituir o versionCode no arquivo
        sed -i "s/versionCode:\s*$CURRENT_VERSION/versionCode: $NEW_VERSION/" app.config.js
        echo "✅ Version code atualizado para: $NEW_VERSION"
    else
        echo "❌ Não foi possível encontrar versionCode em app.config.js"
        exit 1
    fi
else
    # Fallback para app.json se existir
    if [ -f "app.json" ]; then
        CURRENT_VERSION=$(grep '"versionCode":' app.json | sed 's/.*"versionCode": \([0-9]*\).*/\1/')
        NEW_VERSION=$((CURRENT_VERSION + 1))
        sed -i "s/\"versionCode\": $CURRENT_VERSION/\"versionCode\": $NEW_VERSION/" app.json
        echo "✅ Version code atualizado para: $NEW_VERSION"
    else
        echo "❌ Não foi possível encontrar app.config.js ou app.json"
        exit 1
    fi
fi

# 5. Gerar build de produção
echo "🔨 Gerando build de produção..."
eas build --platform android --profile production

# 6. Aguardar conclusão do build
echo "⏳ Aguardando conclusão do build..."
BUILD_ID=$(eas build:list --platform android --limit 1 --json | jq -r '.[0].id')
echo "📱 Build ID: $BUILD_ID"

# 7. Verificar status do build
while true; do
    STATUS=$(eas build:view $BUILD_ID --json | jq -r '.status')
    echo "📊 Status do build: $STATUS"

    if [ "$STATUS" = "finished" ]; then
        echo "✅ Build concluído com sucesso!"
        break
    elif [ "$STATUS" = "errored" ]; then
        echo "❌ Erro no build. Verifique os logs:"
        eas build:view $BUILD_ID
        exit 1
    fi

    echo "⏳ Aguardando 30 segundos..."
    sleep 30
done

# 8. Baixar o AAB
echo "📥 Baixando arquivo AAB..."
eas build:download $BUILD_ID

# 9. Instruções para Play Console
echo ""
echo "🎉 Build gerado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Acesse: https://play.google.com/console"
echo "2. Crie uma conta (R$ 25)"
echo "3. Crie um novo app"
echo "4. Faça upload do arquivo AAB baixado"
echo "5. Configure as informações do app"
echo "6. Adicione screenshots"
echo "7. Configure política de privacidade"
echo "8. Submeta para revisão"
echo ""
echo "📁 Arquivo AAB: ./builds/obra-limpa.aab"
echo "📊 Build ID: $BUILD_ID"
echo ""
echo "🚀 Boa sorte com a publicação!"
