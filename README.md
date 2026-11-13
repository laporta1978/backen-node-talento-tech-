# API REST  Proyecto Final Node - Talento Tech 2026

API RESTful desarrollada con Node.js, Express y TypeScript para la gestión de productos con autenticación JWT, Firebase Auth, almacenamiento en Cloud Firestore y consola web interactiva.

## Descripción

Este proyecto implementa una API REST completa siguiendo las mejores prácticas de arquitectura de software, utilizando una estructura en capas (`Routes → Controllers → Services → Models`) que facilita el mantenimiento y escalabilidad del código.

La aplicación proporciona un sistema de autenticación mediante JSON Web Tokens (JWT) y Firebase Authentication, junto con reglas de seguridad endurecidas en Cloud Firestore (`firestore.rules`) basadas en roles (`admin` / `user`).

## Características Principales

- **Autenticación y Autorización**: Sistema completo de login JWT (`POST /auth/login`), intercambio con Firebase Google Auth (`POST /auth/firebase`), registro, verificación y refresco de token con protección basada en roles (`admin` / `user`)
- **Gestión de Productos**: CRUD completo para productos con validaciones multinivel
- **Base de datos en la nube**: Integración real con Firebase Cloud Firestore (`products`, `users`, `admins`)
- **Arquitectura en capas**: Separación clara de responsabilidades (`Routes → Controllers → Services → Models`)
- **Validaciones**: Validación de datos de entrada, reglas de seguridad en Firestore y manejo centralizado de errores HTTP
- **CORS configurado**: Preparado para recibir peticiones de aplicaciones frontend
- **Variables de entorno**: Configuración segura mediante archivos `.env`
- **Middleware personalizado**: Sistema de middlewares para autenticación JWT, autorización por roles y manejo de errores
- **Consola Web Integrada**: Interfaz en React + Tailwind CSS para gestionar el catálogo en tiempo real y probar todos los endpoints en vivo

## Tecnologías Utilizadas

- **Runtime**: Node.js (v22+)
- **Framework Web**: Express.js
- **Base de datos**: Firebase Cloud Firestore (`firebase`)
- **Autenticación**: JSON Web Tokens (`jsonwebtoken`), Firebase Auth + Hashing (`bcryptjs`)
- **Frontend de Consola**: React 19 + Vite + Tailwind CSS
- **Middleware**: CORS, `body-parser`
- **Variables de entorno**: Dotenv

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- Node.js (versión 22 o superior)
- npm (versión 8 o superior)
- Un proyecto Firebase con Firestore habilitado (`firebase-applet-config.json`)

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env` en la raíz del proyecto:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# JWT Secret (usar una clave aleatoria segura en producción)
JWT_SECRET="tu_clave_secreta_super_segura_minimo_32_caracteres"
```

### 3. Iniciar el servidor

En modo desarrollo:

```bash
npm run dev
```

Para compilar el frontend e iniciar en modo producción:

```bash
npm run build
npm run start
```

El servidor estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
proyecto-node-final/
│
├── 📂 config/                      # Configuraciones
│   ├── firebase.config.ts          # Conexión con Firebase y Cloud Firestore
│   ├── database.config.ts          # Almacenamiento auxiliar para usuarios JWT locales
│   └── env.config.ts               # Variables de entorno y configuración JWT
│
├── 📂 controllers/                 # Controladores (Handlers)
│   ├── auth.controller.ts          # Login JWT, Firebase Auth, registro, verificación
│   └── products.controller.ts      # CRUD de productos
│
├── 📂 middlewares/                 # Middlewares personalizados
│   └── auth.middleware.ts          # Autenticación JWT, roles y manejo de errores
│
├── 📂 models/                      # Modelos (Data Access)
│   ├── product.model.ts            # Interacción con colección products en Firestore
│   └── user.model.ts               # Interacción con usuarios
│
├── 📂 routes/                      # Definición de rutas
│   ├── auth.routes.ts              # Rutas de autenticación (/auth)
│   └── products.routes.ts          # Rutas de productos (/api/products)
│
├── 📂 services/                    # Lógica de negocio
│   ├── auth.service.ts             # Validaciones, Firebase lookup, bcrypt y JWT
│   └── products.service.ts         # Validaciones y reglas de productos
│
├── 📂 src/                         # Frontend (Consola de gestión y explorador API)
│   ├── components/
│   ├── firebase.ts                 # SDK cliente Firebase, Google Auth y onSnapshot
│   └── App.tsx
│
├── 📄 firebase-applet-config.json  # Configuración del proyecto Firebase aprovisionado
├── 📄 firebase-blueprint.json      # Blueprint de entidades y colecciones Firestore
├── 📄 firestore.rules              # Reglas de seguridad desplegadas en Firestore
├── 📄 .env.example                 # Plantilla de variables de entorno
├── 📄 .gitignore                   # Archivos ignorados por Git
├── 📄 server.ts                    # Punto de entrada del servidor Express
├── 📄 package.json                 # Dependencias y scripts
└── 📄 README.md                    # Documentación del proyecto
```

### Arquitectura del Sistema

```
Cliente (Frontend / cURL)
        ↓
    Routes (Endpoints)
        ↓
    Middlewares (JWT / Roles)
        ↓
    Controllers (Manejo de Request/Response)
        ↓
    Services (Lógica de negocio y validaciones)
        ↓
    Models (Acceso a datos)
        ↓
    Firebase Cloud Firestore
```

## Endpoints de la API

### Autenticación

#### POST /auth/login
Autenticar usuario y obtener token JWT.

**Request:**
```json
{
  "email": "admin@talentotech.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer",
    "expiresIn": "24h",
    "user": {
      "id": "usr_admin_01",
      "email": "admin@talentotech.com",
      "nombre": "Administrador Talento Tech",
      "role": "admin"
    }
  }
}
```

#### POST /auth/register
Registrar una nueva cuenta con rol estándar (`user`).

**Request:**
```json
{
  "nombre": "Sofía Martínez",
  "email": "sofia@talentotech.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer",
    "expiresIn": "24h",
    "user": {
      "id": "usr_...",
      "email": "sofia@talentotech.com",
      "nombre": "Sofía Martínez",
      "role": "user"
    }
  }
}
```

#### GET /auth/verify
Verificar validez del token JWT.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "user": {
      "userId": "usr_admin_01",
      "email": "admin@talentotech.com",
      "role": "admin"
    }
  }
}
```

#### POST /auth/refresh
Refrescar token JWT existente.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refrescado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer",
    "expiresIn": "24h"
  }
}
```

#### GET /auth/me
Obtener información del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Usuario obtenido correctamente",
  "data": {
    "id": "usr_admin_01",
    "email": "admin@talentotech.com",
    "nombre": "Administrador Talento Tech",
    "role": "admin",
    "activo": true,
    "fechaCreacion": "2025-12-10T..."
  }
}
```

### Productos

#### GET /api/products
Obtener todos los productos (ruta pública). Acepta opcionalmente `?search=...` y `?activo=true`.

**Response (200):**
```json
{
  "success": true,
  "message": "Productos obtenidos correctamente",
  "data": [
    {
      "id": "prod_...",
      "nombre": "Agua Mineral Sin Gas 1.5L",
      "precio": 1500,
      "stock": 36,
      "descripcion": "Botella de agua mineral natural de manantial para oficina y eventos.",
      "activo": true,
      "creadoPor": "usuario@talentotech.com",
      "creadoPorId": "usr_std_02",
      "fechaCreacion": "2025-12-10T...",
      "fechaActualizacion": "2025-12-10T..."
    }
  ],
  "total": 4
}
```

#### GET /api/products/:id
Obtener un producto específico por ID (ruta pública).

**Response (200):**
```json
{
  "success": true,
  "message": "Producto obtenido correctamente",
  "data": {
    "id": "prod_...",
    "nombre": "Agua Mineral Sin Gas 1.5L",
    "precio": 1500,
    "stock": 36,
    "descripcion": "Botella de agua mineral natural de manantial para oficina y eventos.",
    "activo": true,
    "fechaCreacion": "2025-12-10T...",
    "fechaActualizacion": "2025-12-10T..."
  }
}
```

#### POST /api/products/create
Crear un nuevo producto (requiere autenticación).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "nombre": "Mouse Logitech MX Master",
  "precio": 99.99,
  "stock": 15,
  "descripcion": "Mouse ergonómico inalámbrico",
  "activo": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "id": "prod_...",
    "nombre": "Mouse Logitech MX Master",
    "precio": 99.99,
    "stock": 15,
    "descripcion": "Mouse ergonómico inalámbrico",
    "activo": true,
    "creadoPor": "admin@talentotech.com",
    "creadoPorId": "usr_admin_01",
    "fechaCreacion": "2025-12-10T...",
    "fechaActualizacion": "2025-12-10T..."
  }
}
```

#### PUT /api/products/:id
Actualizar un producto existente (requiere autenticación).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "nombre": "Mouse Logitech MX Master 3",
  "precio": 109.99,
  "stock": 20
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Producto actualizado correctamente",
  "data": {
    "id": "prod_...",
    "nombre": "Mouse Logitech MX Master 3",
    "precio": 109.99,
    "stock": 20,
    "actualizadoPor": "admin@talentotech.com",
    "fechaActualizacion": "2025-12-10T..."
  }
}
```

#### DELETE /api/products/:id
Eliminar un producto (requiere autenticación y rol `admin`).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Producto eliminado correctamente",
  "data": {
    "id": "prod_...",
    "nombre": "Producto eliminado"
  },
  "deletedBy": "admin@talentotech.com"
}
```

## Autenticación y Autorización

### Niveles de Protección

| Método | Endpoint | Protección | Rol Requerido |
|--------|----------|------------|---------------|
| GET | `/api/products` | Pública | Ninguno |
| GET | `/api/products/:id` | Pública | Ninguno |
| POST | `/api/products/create` | Protegida | Autenticado |
| PUT | `/api/products/:id` | Protegida | Autenticado |
| DELETE | `/api/products/:id` | Protegida | Admin |
| POST | `/auth/login` | Pública | Ninguno |
| POST | `/auth/register` | Pública | Ninguno |
| GET | `/auth/verify` | Protegida | Autenticado |
| POST | `/auth/refresh` | Protegida | Autenticado |
| GET | `/auth/me` | Protegida | Autenticado |

### Formato del Token

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer {tu_token_jwt}
```

### Roles y Usuarios de Prueba Precargados

- **admin** (`admin@talentotech.com` / `admin123`): Acceso completo a todas las operaciones, incluida la eliminación de productos.
- **user** (`usuario@talentotech.com` / `user123`): Puede crear y actualizar productos, pero recibe `403 Forbidden` al intentar eliminar.

## Códigos de Estado HTTP

- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **400 Bad Request**: Datos de entrada inválidos
- **401 Unauthorized**: Token no proporcionado, inválido o expirado
- **403 Forbidden**: Sin permisos suficientes para la operación
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error interno del servidor

## Ejemplos de Uso

### Usando cURL

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@talentotech.com","password":"admin123"}'
```

**Crear producto:**
```bash
curl -X POST http://localhost:3000/api/products/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {tu_token}" \
  -d '{"nombre":"Teclado Mecánico","precio":150,"stock":10}'
```

**Obtener productos:**
```bash
curl http://localhost:3000/api/products
```

### Usando JavaScript (Fetch API)

```javascript
// Login
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@talentotech.com',
    password: 'admin123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// Crear producto
const productResponse = await fetch('http://localhost:3000/api/products/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    nombre: 'Monitor Samsung 27"',
    precio: 350,
    stock: 8,
    descripcion: 'Monitor 4K UHD'
  })
});

const product = await productResponse.json();
console.log(product);
```

## Scripts Disponibles

En el archivo `package.json` están definidos los siguientes scripts:

- `npm run dev`: Inicia el servidor Express + Vite en modo desarrollo con `tsx`
- `npm run build`: Compila el frontend de consola en `dist/`
- `npm run start`: Ejecuta `node server.ts` en modo producción
- `npm run lint`: Verifica tipos con `tsc --noEmit`

## Seguridad

1. **Contraseñas**: Hasheadas con `bcryptjs` (salt rounds = 10) antes de persistirse.
2. **JWT_SECRET**: Configurar una clave aleatoria de al menos 64 caracteres en producción mediante variables de entorno.
3. **Control de Acceso**: Separación estricta entre usuarios autenticados y administradores en el middleware `requireRole`.
4. **Variables de entorno**: Nunca versionar el archivo `.env` ni el directorio `data/`.

## Licencia

Este proyecto por talento tech gaston la porta  2026

---

**Versión:** 2.1.0  
**Última actualización:** Noviembre 2026  
**Autor:** Gaston La Porta / Estudiante Talento Tech

