# Conecta Córdoba - Render.com Deployment

Plataforma de conexión entre clientes y profesionales de servicios en Córdoba, Argentina. Esta versión está optimizada para deployment en Render.com con PostgreSQL.

## 🚀 Características

- **Sistema de Autenticación**: Registro y login para clientes y profesionales
- **Búsqueda de Profesionales**: Filtrar por zona, oficio y calificaciones
- **Sistema de Conexiones**: Los clientes pueden conectar con profesionales (3ra conexión requiere pago)
- **Sistema de Reviews**: Calificaciones y comentarios verificados
- **140+ Zonas de Córdoba**: Cobertura completa de la provincia
- **60+ Oficios**: Amplia variedad de servicios profesionales
- **Responsive Design**: Funciona en desktop y móvil

## 🛠️ Tecnologías

### Backend
- **Node.js** con Express.js
- **PostgreSQL** como base de datos
- **Sequelize** ORM
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **express-validator** para validación de datos

### Frontend
- **HTML5** semántico
- **Bootstrap 5** para UI responsiva
- **Vanilla JavaScript** con APIs modernas
- **Font Awesome** para iconos

## 📦 Deployment en Render.com

### Prerrequisitos

1. Cuenta en [Render.com](https://render.com)
2. Repositorio de Git con el código
3. Node.js 18.x (configurado en engines del package.json)

### Pasos de Deployment

#### 1. Configurar la Base de Datos

1. En Render Dashboard, crea un nuevo **PostgreSQL** service:
   - Name: `conecta-cordoba-db`
   - Region: Oregon (recomendado)
   - Plan: Starter o Free
   
2. Copia la **Internal Database URL** que te proporciona Render

#### 2. Configurar el Web Service

1. En Render Dashboard, crea un nuevo **Web Service**:
   - Connect tu repositorio de GitHub
   - Name: `conecta-cordoba`
   - Region: Oregon (mismo que la DB)
   - Branch: `main`
   - Build Command: `npm run build`
   - Start Command: `npm start`

#### 3. Variables de Entorno

Configura las siguientes variables en Render Dashboard:

**Variables Requeridas:**
```
DATABASE_URL=postgresql://... (automático desde PostgreSQL service)
JWT_SECRET=tu-secreto-jwt-super-seguro-y-aleatorio
NODE_ENV=production
PORT=10000
```

**Variables Opcionales:**
```
APP_NAME=Conecta Córdoba
APP_URL=https://tu-app.onrender.com
LOG_LEVEL=info
```

#### 4. Deploy Automático

1. Conecta tu repositorio de GitHub
2. Habilita auto-deploy desde la rama main
3. El primer deploy se iniciará automáticamente

### Estructura del Proyecto

```
render/
├── config/
│   └── database.js          # Configuración de PostgreSQL
├── models/
│   ├── User.js              # Modelo de usuarios (clientes/profesionales)
│   ├── Connection.js        # Modelo de conexiones entre usuarios
│   └── Review.js            # Modelo de calificaciones
├── routes/
│   ├── auth.js              # Autenticación (login/register)
│   ├── users.js             # Gestión de perfiles de usuario
│   ├── professionals.js     # Búsqueda y listado de profesionales
│   ├── connections.js       # Gestión de conexiones
│   ├── reviews.js           # Sistema de calificaciones
│   ├── zonas.js             # API de zonas de Córdoba
│   └── oficios.js           # API de oficios disponibles
├── public/
│   ├── index.html           # Página principal
│   ├── css/style.css        # Estilos personalizados
│   └── js/
│       ├── auth.js          # Gestión de autenticación frontend
│       ├── api.js           # Cliente API para comunicación
│       └── main.js          # Lógica principal de la aplicación
├── scripts/
│   └── setup-database.js    # Script de configuración de DB
├── server.js                # Servidor principal Express
├── package.json             # Dependencias y scripts
├── render.yaml              # Configuración de Render
└── .env.example             # Template de variables de entorno
```

## 🔧 Desarrollo Local

### Instalación

```bash
# Clonar el repositorio
git clone <your-repo-url>
cd render

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores locales

# Configurar base de datos
npm run setup:db

# Iniciar en modo desarrollo
npm run dev
```

### Scripts Disponibles

```bash
npm start           # Iniciar servidor de producción
npm run dev         # Iniciar en modo desarrollo con nodemon
npm run build       # Configurar base de datos para producción
npm run setup:db    # Configuración completa de base de datos
npm run migrate     # Solo crear tablas
npm run seed        # Solo insertar datos de prueba
npm run db:test     # Probar conexión a base de datos
npm run db:health   # Verificar estado de la base de datos
```

## 📊 Base de Datos

### Modelos Principales

#### Users
- **Clientes**: Usuarios que buscan profesionales
- **Profesionales**: Proveedores de servicios
- Campos: email, password, nombre, teléfono, zona, oficios, calificaciones

#### Connections
- Representan la conexión entre cliente y profesional
- Numeración automática (1ra, 2da, 3ra conexión)
- La 3ra conexión requiere pago de $1500 ARS
- Estados: pendiente, aceptada, en_progreso, completada, cancelada

#### Reviews
- Calificaciones de 1-5 estrellas
- Comentarios verificados
- Solo para conexiones completadas
- Actualización automática del promedio del profesional

### Datos Iniciales

El sistema incluye:
- **140+ zonas** de Córdoba (ciudades y municipios)
- **60+ oficios** organizados en 12 categorías
- Usuarios de ejemplo para testing

## 🔐 Seguridad

- Contraseñas hasheadas con bcryptjs
- Autenticación JWT con expiración
- Validación de datos con express-validator
- Protección CORS configurada
- Variables de entorno para datos sensibles
- Rate limiting en endpoints públicos

## 📱 Frontend

### Características
- Diseño responsive con Bootstrap 5
- Autenticación con modales
- Búsqueda en tiempo real de profesionales
- Sistema de calificaciones con estrellas
- Notificaciones toast para feedback
- Manejo de estados de conexión

### APIs Principales
- `GET /api/professionals` - Buscar profesionales
- `POST /api/connections` - Crear conexión
- `POST /api/reviews` - Crear calificación
- `GET /api/zonas` - Obtener zonas de Córdoba
- `GET /api/oficios` - Obtener oficios disponibles

## 🚦 Monitoring y Logs

Render proporciona:
- **Logs en tiempo real** del aplicativo
- **Métricas de performance** (CPU, memoria, red)
- **Health checks** automáticos
- **SSL certificates** automáticos

## 🔄 Actualizaciones

Para actualizar la aplicación:
1. Haz push a la rama main en GitHub
2. Render detectará los cambios automáticamente
3. Se ejecutará el build y deploy automático
4. La aplicación se actualizará sin downtime

## 📞 Soporte

### Logs de Debugging
```bash
# Ver logs en tiempo real en Render Dashboard
# O usar la CLI de Render:
render logs -s your-service-name
```

### Verificar Estado de la Base de Datos
```bash
# Si tienes acceso SSH o desde la consola de Render:
npm run db:health
```

### Resetear Base de Datos (CUIDADO)
```bash
# Solo en desarrollo/testing:
npm run setup:db
```

## 📈 Escalabilidad

### Planes Recomendados

**Desarrollo/Testing:**
- Web Service: Free plan
- PostgreSQL: Free plan (1GB)

**Producción:**
- Web Service: Starter ($7/mes)
- PostgreSQL: Starter ($7/mes, 1GB)

**Alto Tráfico:**
- Web Service: Standard ($25/mes)
- PostgreSQL: Standard ($20/mes, 10GB)

### Optimizaciones de Performance
- Índices en campos de búsqueda frecuente
- Paginación en listados largos
- Caché de consultas frecuentes
- Compresión de respuestas

## 🔗 URLs Importantes

- **Aplicación**: https://your-app-name.onrender.com
- **Dashboard de Render**: https://dashboard.render.com
- **Documentación de Render**: https://render.com/docs

---

### 🎉 ¡Tu aplicación Conecta Córdoba está lista para Render.com!

Para cualquier duda o problema, revisa los logs en el dashboard de Render o consulta la documentación oficial.