#!/bin/bash

# Pastikan script berhenti jika ada error
set -e

echo "==========================================="
echo "🚀 Memulai Deployment Aplikasi LKD..."
echo "==========================================="

echo "📥 1. Menarik pembaruan kode terbaru dari GitHub..."
git fetch origin
git reset --hard origin/main

echo "🛠️  2. Membangun ulang (build) semua Docker Images..."

# Build Frontend PWA
echo "   📦 Building Frontend (LKD PWA)..."
docker compose build --no-cache lapkin-lkd

# Build Backend API
echo "   📦 Building Backend (Sync API)..."
docker compose build --no-cache lapkin-api

echo "🔄 3. Menghentikan container lama dan menjalankan yang baru..."
docker compose up -d --force-recreate

echo "🧹 4. Membersihkan file image yang tidak terpakai..."
docker image prune -f

echo "==========================================="
echo "✅ Deployment selesai!"
echo "   🌐 Frontend: http://localhost:18080"
echo "   🔌 Sync API: http://localhost:18081/api/health"
echo "   🗄️  Database: localhost:18432"
echo "==========================================="
