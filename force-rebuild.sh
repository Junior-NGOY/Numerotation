#!/bin/bash

# Script pour forcer le rebuild et nettoyer le cache

echo "🧹 Nettoyage du cache Next.js..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Réinstallation des dépendances..."
npm ci

echo "🔨 Build de production..."
npm run build

echo "✅ Rebuild terminé - cache invalidé"
