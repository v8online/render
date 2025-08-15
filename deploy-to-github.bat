@echo off
echo ========================================
echo  CONECTA CORDOBA - DEPLOY TO GITHUB
echo ========================================
echo.

echo 📁 Navegando al directorio del proyecto...
cd /d "C:\Users\v8\Desktop\MisProyectos\render"

echo 🔍 Verificando contenido del proyecto...
dir /b

echo.
echo 🔧 Inicializando Git...
git init

echo.
echo ➕ Agregando todos los archivos...
git add .

echo.
echo 💾 Creando commit inicial...
git commit -m "Initial commit: Conecta Cordoba for Render.com deployment"

echo.
echo ⚠️  IMPORTANTE: Ahora necesitas crear el repositorio en GitHub
echo    1. Ve a https://github.com/new
echo    2. Nombre: render
echo    3. Descripcion: Conecta Cordoba - Plataforma para profesionales optimizada para Render.com
echo    4. Publico o Privado (tu eleccion)
echo    5. NO marques "Add README" (ya tenemos uno)
echo    6. Crea el repositorio
echo.

echo 🌐 Despues ejecuta estos comandos (reemplaza TU-USUARIO):
echo    git remote add origin https://github.com/TU-USUARIO/render.git
echo    git branch -M main
echo    git push -u origin main
echo.

echo ✅ Preparacion completada!
echo    El proyecto esta listo para subir a GitHub
echo.
pause