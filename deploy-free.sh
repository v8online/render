#!/bin/bash

# Script de deployment gratuito para Render.com
# Este script maneja el deployment en la cuenta gratuita

echo "🚀 Conecta Córdoba - Free Deployment Script"
echo "=========================================="

# Verificar si estamos en Render
if [ -n "$RENDER" ]; then
    echo "📍 Detectado entorno Render.com"
    
    # Instalar dependencias
    echo "📦 Instalando dependencias..."
    npm install
    
    # Verificar si tenemos DATABASE_URL
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ Base de datos encontrada, configurando backend..."
        
        # Configurar base de datos
        echo "🗄️ Configurando base de datos..."
        npm run setup:db
        
        # Iniciar servidor backend
        echo "🌐 Iniciando servidor backend..."
        npm start
    else
        echo "⚠️ No hay DATABASE_URL, sirviendo frontend estático..."
        
        # Servir archivos estáticos
        echo "📄 Sirviendo frontend estático..."
        npx http-server public -p $PORT -c-1
    fi
else
    echo "💻 Entorno local detectado"
    echo "🔧 Usar: npm run dev para desarrollo"
fi