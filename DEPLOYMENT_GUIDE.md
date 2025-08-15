# 🚀 Guía de Deployment - Conecta Córdoba en Render.com

Esta guía te llevará paso a paso para deployar la aplicación Conecta Córdoba en Render.com con PostgreSQL.

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener:

- [ ] Cuenta en [Render.com](https://render.com) (gratuita)
- [ ] Cuenta en [GitHub](https://github.com) con el código subido
- [ ] El proyecto "render" completo en tu repositorio

## 🗂️ Paso 1: Preparar el Repositorio

### 1.1 Subir el Código a GitHub

```bash
# Si aún no has inicializado git:
cd /path/to/render
git init
git add .
git commit -m "Initial commit - Conecta Córdoba for Render"

# Crear repositorio en GitHub y conectar:
git remote add origin https://github.com/tu-usuario/conecta-cordoba-render.git
git branch -M main
git push -u origin main
```

### 1.2 Verificar Estructura del Proyecto

Asegúrate de que tienes esta estructura:
```
render/
├── config/database.js
├── models/ (User.js, Connection.js, Review.js)
├── routes/ (auth.js, users.js, professionals.js, etc.)
├── public/ (index.html, css/, js/)
├── scripts/setup-database.js
├── server.js
├── package.json
├── render.yaml
└── README.md
```

## 🗄️ Paso 2: Crear la Base de Datos PostgreSQL

### 2.1 Acceder a Render Dashboard

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Haz clic en **"New +"** → **"PostgreSQL"**

### 2.2 Configurar PostgreSQL

**Configuración recomendada:**
- **Name**: `conecta-cordoba-db`
- **Database**: `conectacordoba` (o el nombre que prefieras)
- **User**: `conectacordoba` (se genera automáticamente)
- **Region**: `Oregon` (más barato y eficiente)
- **PostgreSQL Version**: `15` (la más reciente)
- **Plan**: 
  - **Free** para desarrollo/testing
  - **Starter ($7/mes)** para producción

### 2.3 Obtener Credenciales

Una vez creada la base de datos:

1. Ve a la página de tu PostgreSQL service
2. Copia los siguientes datos (los necesitarás después):
   - **Internal Database URL** (la más importante)
   - **External Database URL** (para conexiones externas)
   - **Host**, **Port**, **Database**, **Username**, **Password**

**Ejemplo de Internal Database URL:**
```
postgresql://conectacordoba:gkL8K9mN...@dpg-xyz123.oregon-postgres.render.com/conectacordoba_abc
```

## 🌐 Paso 3: Crear el Web Service

### 3.1 Crear Nuevo Web Service

1. En Render Dashboard, haz clic en **"New +"** → **"Web Service"**
2. Selecciona **"Connect a repository"**
3. Autoriza GitHub y selecciona tu repositorio `conecta-cordoba-render`

### 3.2 Configuración del Web Service

**Configuración inicial:**
- **Name**: `conecta-cordoba`
- **Region**: `Oregon` (mismo que la base de datos)
- **Branch**: `main`
- **Root Directory**: `/` (si el proyecto está en la raíz) o `/render` (si está en subcarpeta)

**Comandos de Build y Start:**
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

**Runtime:**
- **Environment**: `Node`
- **Node Version**: `18` (especificado en package.json)

### 3.3 Plan de Servicio

- **Free**: Ideal para desarrollo y testing
- **Starter ($7/mes)**: Recomendado para producción
- **Standard ($25/mes)**: Para alto tráfico

## 🔧 Paso 4: Configurar Variables de Entorno

### 4.1 Variables Requeridas

En la sección **"Environment"** de tu Web Service, agrega:

#### DATABASE_URL
```
DATABASE_URL
```
**Valor**: Pega la **Internal Database URL** que copiaste del PostgreSQL service

#### JWT_SECRET
```
JWT_SECRET
```
**Valor**: Genera una clave secreta aleatoria. Usa el botón **"Generate"** de Render o crea una manualmente:
```
conecta-cordoba-jwt-secret-2024-muy-seguro-cambiar-en-produccion
```

#### NODE_ENV
```
NODE_ENV
production
```

#### PORT
```
PORT
10000
```
**Nota**: Render asigna automáticamente el puerto, pero por si acaso.

### 4.2 Variables Opcionales

```
APP_NAME
Conecta Córdoba

APP_URL
https://conecta-cordoba.onrender.com

LOG_LEVEL
info
```

### 4.3 Verificar Variables

Tu lista de variables debería verse así:
```
✅ DATABASE_URL = postgresql://conectacordoba:...
✅ JWT_SECRET = tu-secreto-super-seguro
✅ NODE_ENV = production
✅ PORT = 10000
✅ APP_NAME = Conecta Córdoba
✅ APP_URL = https://tu-app.onrender.com
✅ LOG_LEVEL = info
```

## 🚀 Paso 5: Realizar el Deploy

### 5.1 Iniciar el Deploy

1. Haz clic en **"Create Web Service"**
2. Render comenzará automáticamente el proceso de build y deploy
3. Puedes ver los logs en tiempo real

### 5.2 Monitorear el Deploy

**Fases del deploy:**
1. **Cloning repository**: Descargando el código
2. **Building**: Ejecutando `npm run build`
3. **Starting**: Ejecutando `npm start`
4. **Live**: ¡Aplicación funcionando!

### 5.3 Verificar que Todo Funciona

**En los logs deberías ver:**
```
📘 [timestamp] Testing database connection...
✅ [timestamp] Database connection established successfully
📘 [timestamp] Creating database tables...
✅ [timestamp] All tables created successfully
📘 [timestamp] Seeding initial data...
✅ [timestamp] Initial data seeded successfully
🎉 [timestamp] Database setup completed successfully!
📘 [timestamp] Server running on port 10000
📘 [timestamp] Environment: production
```

## 🎯 Paso 6: Probar la Aplicación

### 6.1 Acceder a la URL

Tu aplicación estará disponible en:
```
https://conecta-cordoba.onrender.com
```
(o el nombre que hayas elegido)

### 6.2 Pruebas Básicas

**Funcionalidades a probar:**

1. **Página Principal**: ¿Se carga correctamente?
2. **Registro**: Crear cuenta como cliente y como profesional
3. **Login**: Iniciar sesión con las cuentas creadas
4. **Búsqueda**: Buscar profesionales por zona/oficio
5. **Estadísticas**: Verificar que se muestran datos reales

### 6.3 Cuentas de Prueba

Si el seed funcionó, deberías tener estas cuentas de prueba:

**Cliente:**
- Email: `cliente1@ejemplo.com`
- Contraseña: `password123`

**Profesionales:**
- Email: `profesional1@ejemplo.com` (Plomero en Villa Carlos Paz)
- Email: `profesional2@ejemplo.com` (Electricista en Alta Gracia)
- Contraseña: `password123` para ambos

## 🔍 Paso 7: Debugging y Troubleshooting

### 7.1 Ver Logs en Tiempo Real

1. Ve a tu Web Service en Render Dashboard
2. Haz clic en la pestaña **"Logs"**
3. Los logs se actualizan automáticamente

### 7.2 Problemas Comunes y Soluciones

#### ❌ Error: "Database connection failed"

**Posibles causas:**
- DATABASE_URL incorrecta
- PostgreSQL service no está corriendo
- Firewall/network issues

**Solución:**
1. Verifica que el PostgreSQL service esté activo
2. Copia nuevamente la Internal Database URL
3. Asegúrate de que no haya espacios extra en la variable

#### ❌ Error: "JWT secret required"

**Solución:**
1. Verifica que JWT_SECRET esté configurado
2. Debe ser una string de al menos 32 caracteres
3. Reinicia el deploy

#### ❌ Error: "Port already in use"

**Solución:**
1. Elimina la variable PORT (Render maneja esto automáticamente)
2. O asegúrate de que sea 10000

#### ❌ Error: "Module not found"

**Solución:**
1. Verifica que package.json esté en la raíz del proyecto
2. Asegúrate de que todas las dependencias estén listadas
3. Revisa que el Root Directory esté correcto

### 7.3 Comandos de Debugging

Si tienes acceso a shell (planes pagos):

```bash
# Verificar estado de la base de datos
npm run db:health

# Probar conexión
npm run db:test

# Ver configuración actual
env | grep -E "(NODE_ENV|DATABASE_URL|JWT_SECRET)"
```

## 🔄 Paso 8: Configurar Auto-Deploy

### 8.1 Activar Auto-Deploy

1. En tu Web Service, ve a la pestaña **"Settings"**
2. En la sección **"Build & Deploy"**:
   - **Auto-Deploy**: `Yes`
   - **Branch**: `main`

### 8.2 Verificar Webhooks

Render debería configurar automáticamente webhooks en tu repositorio de GitHub. Verifica en:
- GitHub → Tu repo → Settings → Webhooks
- Debería haber un webhook de Render

### 8.3 Realizar un Deploy de Prueba

```bash
# Hacer un cambio menor
echo "<!-- Deploy test -->" >> render/public/index.html

# Commit y push
git add .
git commit -m "Test auto-deploy"
git push origin main
```

En unos minutos, deberías ver un nuevo deploy en Render.

## 📊 Paso 9: Monitoreo y Mantenimiento

### 9.1 Métricas Importantes

En Render Dashboard puedes ver:
- **CPU Usage**: Debería estar bajo 50% normalmente
- **Memory Usage**: Debería estar bajo 80%
- **Response Time**: Idealmente bajo 500ms
- **Error Rate**: Debería ser 0% o muy bajo

### 9.2 Configurar Alertas

1. Ve a tu Web Service → **"Settings"** → **"Alerts"**
2. Configura alertas para:
   - High CPU usage (>80%)
   - High memory usage (>90%)
   - Service down

### 9.3 Backups de Base de Datos

**Para PostgreSQL Free:**
- No hay backups automáticos
- Considera hacer backups manuales periódicos

**Para PostgreSQL Starter/Standard:**
- Backups automáticos incluidos
- Retention de 7-30 días según el plan

## ✅ Checklist Final

### Pre-Deploy
- [ ] Código subido a GitHub
- [ ] PostgreSQL service creado
- [ ] Web service configurado
- [ ] Variables de entorno establecidas

### Post-Deploy
- [ ] Aplicación accesible vía HTTPS
- [ ] Base de datos funcionando (usuarios de prueba creados)
- [ ] Logs sin errores críticos
- [ ] Funcionalidades básicas operativas
- [ ] Auto-deploy configurado

### Producción
- [ ] Plan de servicio apropiado (Starter mínimo)
- [ ] Dominio personalizado configurado (opcional)
- [ ] Monitoreo y alertas activos
- [ ] Backups verificados

## 🎉 ¡Felicitaciones!

Tu aplicación Conecta Córdoba está ahora funcionando en Render.com con:

- ✅ Backend API con Express.js
- ✅ Base de datos PostgreSQL
- ✅ Frontend responsive
- ✅ Sistema de autenticación
- ✅ SSL/HTTPS automático
- ✅ Auto-deploy desde GitHub

**URLs importantes:**
- **Aplicación**: https://tu-app.onrender.com
- **Dashboard**: https://dashboard.render.com
- **Logs**: https://dashboard.render.com/web/[service-id]/logs

---

### 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** en Render Dashboard
2. **Consulta la documentación** de [Render](https://render.com/docs)
3. **Verifica la configuración** paso a paso con esta guía
4. **Usa las cuentas de prueba** para verificar funcionalidad

¡Tu plataforma de profesionales de Córdoba está lista para conectar clientes con los mejores servicios de la provincia! 🇦🇷