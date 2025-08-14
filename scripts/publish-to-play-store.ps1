# 🚀 Script de Publicação - Obra Limpa (Windows)
# Este script automatiza o processo de publicação na Play Store

Write-Host "🏗️ Iniciando processo de publicação do Obra Limpa..." -ForegroundColor Green

# 1. Verificar se o EAS CLI está instalado
try {
    $null = Get-Command eas -ErrorAction Stop
    Write-Host "✅ EAS CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ EAS CLI não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g @expo/eas-cli
}

# 2. Verificar se está logado no Expo
Write-Host "🔐 Verificando login no Expo..." -ForegroundColor Cyan
try {
    $null = eas whoami 2>$null
    Write-Host "✅ Logado no Expo" -ForegroundColor Green
} catch {
    Write-Host "❌ Não está logado no Expo. Faça login:" -ForegroundColor Yellow
    eas login
}

# 3. Verificar se o projeto está configurado
Write-Host "⚙️ Verificando configuração do projeto..." -ForegroundColor Cyan
if (-not (Test-Path "eas.json")) {
    Write-Host "❌ eas.json não encontrado. Configurando..." -ForegroundColor Yellow
    eas build:configure
}

# 4. Limpar console.log
Write-Host "🧹 Removendo console.log..." -ForegroundColor Cyan
node scripts/remove-console-logs.js

# 5. Atualizar version code
Write-Host "📝 Atualizando version code..." -ForegroundColor Cyan

# Verificar se existe app.config.js
if (Test-Path "app.config.js") {
    # Ler o conteúdo do arquivo app.config.js
    $appConfigContent = Get-Content "app.config.js" -Raw
    
    # Extrair o versionCode atual usando regex
    if ($appConfigContent -match "versionCode:\s*(\d+)") {
        $currentVersion = [int]$Matches[1]
        $newVersion = $currentVersion + 1
        
        # Substituir o versionCode no arquivo
        $updatedContent = $appConfigContent -replace "versionCode:\s*\d+", "versionCode: $newVersion"
        Set-Content "app.config.js" -Value $updatedContent
        
        Write-Host "✅ Version code atualizado para: $newVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Não foi possível encontrar versionCode em app.config.js" -ForegroundColor Red
        exit 1
    }
} else {
    # Fallback para app.json se existir
    if (Test-Path "app.json") {
        $appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
        $currentVersion = $appJson.expo.android.versionCode
        $newVersion = $currentVersion + 1
        $appJson.expo.android.versionCode = $newVersion
        $appJson | ConvertTo-Json -Depth 10 | Set-Content "app.json"
        Write-Host "✅ Version code atualizado para: $newVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Não foi possível encontrar app.config.js ou app.json" -ForegroundColor Red
        exit 1
    }
}

# 6. Gerar build de produção
Write-Host "🔨 Gerando build de produção..." -ForegroundColor Cyan
Write-Host "⏳ Isso pode levar alguns minutos..." -ForegroundColor Yellow
eas build --platform android --profile production

# 6. Instruções para Play Console
Write-Host ""
Write-Host "🎉 Build iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Acesse: https://play.google.com/console" -ForegroundColor White
Write-Host "2. Crie uma conta (R$ 25)" -ForegroundColor White
Write-Host "3. Crie um novo app" -ForegroundColor White
Write-Host "4. Faça upload do arquivo AAB baixado" -ForegroundColor White
Write-Host "5. Configure as informações do app" -ForegroundColor White
Write-Host "6. Adicione screenshots" -ForegroundColor White
Write-Host "7. Configure política de privacidade" -ForegroundColor White
Write-Host "8. Submeta para revisão" -ForegroundColor White
Write-Host ""
Write-Host "📊 Version Code: $newVersion" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Boa sorte com a publicação!" -ForegroundColor Green

# 7. Abrir o guia de publicação
Write-Host ""
Write-Host "📖 Abrindo guia de publicação..." -ForegroundColor Cyan
Start-Process "docs/PUBLICACAO_PLAY_STORE.md"
