# ---------------------------------------------------
# Tahap 1: Build PWA menggunakan Node.js
# ---------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Karena project ini berbentuk Monorepo (lapkin), 
# kita perlu meng-copy file package.json dari root dan folder apps
COPY package*.json ./
COPY apps/lkd/package*.json ./apps/lkd/

# Install dependencies (akan membaca konfigurasi workspaces npm)
RUN npm install

# Copy seluruh source code dari LKD
COPY apps/lkd/ ./apps/lkd/

# Lakukan build menggunakan Vite
RUN npm run build -w apps/lkd

# ---------------------------------------------------
# Tahap 2: Setup Server Nginx
# ---------------------------------------------------
FROM nginx:alpine

# Hapus konfigurasi default Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy konfigurasi Nginx khusus untuk Single Page Application
COPY apps/lkd/nginx.conf /etc/nginx/conf.d/default.conf

# Copy hasil build LKD dari Tahap 1 ke folder HTML Nginx
COPY --from=builder /app/apps/lkd/dist /usr/share/nginx/html

# Expose port Nginx (internal)
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]
