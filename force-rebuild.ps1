# Script PowerShell pour forcer le rebuild et nettoyer le cache

Write-Host "🧹 Nettoyage du cache Next.js..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "📦 Réinstallation des dépendances..." -ForegroundColor Yellow
npm ci

Write-Host "🔨 Build de production..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Rebuild terminé - cache invalidé" -ForegroundColor Green
