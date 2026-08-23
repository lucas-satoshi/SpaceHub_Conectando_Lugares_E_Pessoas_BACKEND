#!/usr/bin/env bash
set -e

echo "🚀 Configurando a API SpaceHub Backend (NestJS + Prisma + TiDB Cloud)..."

# Rodar o gerador Node.js para garantir todos os arquivos e o .zip
node generate_backend.js

echo "📦 Instalando dependências..."
npm install

echo "🔄 Gerando o cliente do Prisma..."
npx prisma generate

echo "✨ Backend configurado e pronto!"
echo "Para iniciar em modo de desenvolvimento, execute: npm run start:dev"
