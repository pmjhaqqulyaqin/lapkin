#!/bin/bash

# Pastikan script berhenti jika ada error
set -e

echo "==========================================="
echo "🚀 Memulai Deployment Aplikasi LKD..."
echo "==========================================="

echo "🔐 0. Memeriksa konfigurasi environment (.env)..."
if [ ! -f .env ]; then
    echo "   ⚠️ File .env tidak ditemukan. Membuat secara otomatis dari .env.example..."
    cp .env.example .env
    
    # Generate random string untuk keamanan ekstra (hanya Linux VPS)
    RANDOM_JWT=$(cat /dev/urandom 2>/dev/null | tr -dc 'a-zA-Z0-9' 2>/dev/null | fold -w 40 2>/dev/null | head -n 1 || echo "lkd-jwt-secret-$(date +%s)")
    RANDOM_DB=$(cat /dev/urandom 2>/dev/null | tr -dc 'a-zA-Z0-9' 2>/dev/null | fold -w 20 2>/dev/null | head -n 1 || echo "lkd_secure_db_$(date +%s)")
    
    # Ganti placeholder di .env dengan string random yang baru di-generate
    sed -i "s/LKD_JWT_SECRET=.*/LKD_JWT_SECRET=${RANDOM_JWT}/g" .env
    sed -i "s/LKD_DB_PASSWORD=.*/LKD_DB_PASSWORD=${RANDOM_DB}/g" .env
    
    echo "   ✅ File .env berhasil dibuat dengan password unik."
else
    echo "   ✅ File .env sudah ada."
fi

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
