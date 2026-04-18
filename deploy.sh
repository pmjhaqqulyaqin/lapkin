#!/bin/bash

# Pastikan script berhenti jika ada error
set -e

echo "==========================================="
echo "🚀 Memulai Deployment Aplikasi LKD PWA..."
echo "==========================================="

echo "📥 1. Menarik pembaruan kode terbaru dari GitHub..."
git fetch origin
git reset --hard origin/main

echo "🛠️  2. Membangun ulang (build) Docker Image..."
# Menggunakan docker compose untuk mem-build image ulang dengan chache yang bersih untuk PWA
docker compose build --no-cache lapkin-lkd

echo "🔄 3. Menghentikan container lama dan menjalankan yang baru..."
docker compose up -d --force-recreate lapkin-lkd

echo "🧹 4. Membersihkan file image yang tidak terpakai (Opsional tapi disarankan)..."
docker image prune -f

echo "==========================================="
echo "✅ Deployment selesai! Aplikasi LKD sudah berjalan di Docker."
echo "==========================================="
