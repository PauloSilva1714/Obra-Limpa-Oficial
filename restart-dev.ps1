# Script para reiniciar o ambiente de desenvolvimento de forma limpa
Write-Host "Limpando ambiente de desenvolvimento..." -ForegroundColor Yellow

# Parar todos os processos Node.js
Write-Host "Parando processos Node.js..." -ForegroundColor Blue
taskkill /f /im node.exe 2>$null

# Limpar caches
Write-Host "Limpando caches..." -ForegroundColor Blue
npm cache clean --force
Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".metro-cache" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Temp\metro-cache" -ErrorAction SilentlyContinue
Remove-Item -Force "*.tsbuildinfo" -ErrorAction SilentlyContinue

# Reinstalar dependencias se necessario
if ($args[0] -eq "--reinstall") {
    Write-Host "Reinstalando dependencias..." -ForegroundColor Blue
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    npm install
}

Write-Host "Ambiente limpo! Agora voce pode executar 'npx expo start'" -ForegroundColor Green