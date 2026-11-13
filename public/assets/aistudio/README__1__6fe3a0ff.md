# API REST - Sistema de Gestión de Productos  - Proyecto Final Node - Talento Tech

API RESTful desarrollada con Node.js y Express para la gestión de productos con autenticación JWT y almacenamiento en Firebase Firestore.

## Descripción

Este proyecto implementa una API REST completa siguiendo las mejores prácticas de arquitectura de software, utilizando una estructura en capas (Routes, Controllers, Services, Models) que facilita el mantenimiento y escalabilidad del código.

La aplicación proporciona un sistema de autenticación robusto mediante JSON Web Tokens (JWT) y protección de rutas basada en roles, permitiendo diferentes niveles de acceso según el tipo de usuario.

## Características Principales

- **Autenticación y Autorización**: Sistema completo de login con JWT y protección de rutas basada en roles (admin/user)
- **Gestión de Productos**: CRUD completo para productos con validaciones
- **Base de datos en la nube**: Integración con Firebase Firestore para persistencia de datos
- **Arquitectura en capas**: Separación clara de responsabilidades (Routes → Controllers → Services → Models)
- **Validaciones**: Validación de datos en múltiples niveles
- **CORS configurado**: Preparado para recibir peticiones de aplicaciones frontend
- **Variables de entorno**: Configuración segura mediante archivos .env
- **Middleware personalizado**: Sistema de middlewares para autenticación y autorización

## Tecnologías Utilizadas

- **Runtime**: Node.js
- **Framework Web**: Express.js
- **Base de datos**: Firebase Firestore
- **Autenticación**: JSON Web Tokens (JWT)
- **Módulos ES6**: ESModules habilitados
- **Middleware**: CORS, Body-parser
- **Variables de entorno**: Dotenv

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- Node.js (versión 16 o superior)
- npm (versión 8 o superior)
- Una cuenta de Firebase con un proyecto creado
- Git (opcional, para clonar el repositorio)

## Instalación

### 1. Clonar el repositorio o crear el directorio

```bash
mkdir mi-proyecto-express
cd mi-proyecto-express
```

### 2. Inicializar el proyecto e instalar dependencias

```bash
npm init -y
npm install express cors body-parser dotenv firebase jsonwebtoken
```

### 3. Configurar ESModules

Agregar en `package.json`:

```json
{
  "type": "module"
}
```

### 4. Configurar Firebase

1. Crear un proyecto en Firebase Console
2. Habilitar Firestore Database
3. Crear las colecciones necesarias:
   - `products`: Para almacenar productos
   - `users`: Para almacenar usuarios

### 5. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# JWT Secret
JWT_SECRET=tu_clave_secreta_super_segura_minimo_32_caracteres

# Firebase Configuration
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id
```

### 6. Iniciar el servidor

```bash
npm run start
```

El servidor estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
proyecto-node-final/
│
├── 📂 config/                      # Configuraciones
│   └── firebase.config.js          # Configuración de Firebase
│
├── 📂 controllers/                 # Controladores (Handlers)
│   ├── auth.controller.js          # Login, registro, verificación
│   └── products.controller.js      # CRUD de productos
│
├── 📂 middlewares/                 # Middlewares personalizados
│   └── auth.middleware.js          # Autenticación JWT y autorización
│
├── 📂 models/                      # Modelos (Data Access)
│   ├── product.model.js            # Interacción con productos en DB
│   └── user.model.js               # Interacción con usuarios en DB
│
├── 📂 routes/                      # Definición de rutas
│   ├── auth.routes.js              # Rutas de autenticación
│   └── products.routes.js          # Rutas de productos
│
├── 📂 services/                    # Lógica de negocio
│   ├── auth.service.js             # Validaciones y JWT
│   └── products.service.js         # Validaciones de productos
│
├── 📄 .env                         # Variables de entorno (NO VERSIONAR)
├── 📄 .gitignore                   # Archivos ignorados por Git
├── 📄 index.js                     # Punto de entrada
├── 📄 package.json                 # Dependencias y scripts
├── 📄 package-lock.json            # Lockfile de dependencias
└── 📄 README.md                    # Documentación del proyecto
```

### Arquitectura del Sistema

```
Cliente (Frontend)
        ↓
    Routes (Endpoints)
        ↓
    Controllers (Manejo de Request/Response)
        ↓
    Services (Lógica de negocio)
        ↓
    Models (Interacción con DB)
        ↓
    Firebase Firestore
```

## Endpoints de la API

### Autenticación

#### POST /auth/login
Autenticar usuario y obtener token JWT.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
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
      "id": "user_id",
      "email": "usuario@ejemplo.com",
      "nombre": "Nombre Usuario",
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
      "userId": "user_id",
      "email": "usuario@ejemplo.com",
      "role": "user"
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
    "id": "user_id",
    "email": "usuario@ejemplo.com",
    "nombre": "Nombre Usuario",
    "role": "user",
    "activo": true
  }
}
```

### Productos

#### GET /api/products
Obtener todos los productos (ruta pública).

**Response (200):**
```json
{
  "success": true,
  "message": "Productos obtenidos correctamente",
  "data": [
    {
      "id": "product_id",
      "nombre": "agua",
      "precio": 1500,
      "stock": 36,
      "descripcion": "Laptop de alto rendimiento",
      "activo": true,
      "fechaCreacion": "10 de diciembre de 2025 a las 10:02:43 UTC-3"
    }
  ],
  "total": 1
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
    "id": "product_id",
      "nombre": "agua",
      "precio": 1500,
      "stock": 36,
      "descripcion": "Laptop de alto rendimiento",
      "activo": true,
      "fechaCreacion": "10 de diciembre de 2025 a las 10:02:43 UTC-3"
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
    "id": "new_product_id",
    "nombre": "Mouse Logitech MX Master",
    "precio": 99.99,
    "stock": 15,
    "descripcion": "Mouse ergonómico inalámbrico",
    "activo": true,
    "creadoPor": "usuario@ejemplo.com",
    "fechaCreacion": "2025-12-10T..."
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
    "id": "product_id",
    "nombre": "Mouse Logitech MX Master 3",
    "precio": 109.99,
    "stock": 20,
    "actualizadoPor": "usuario@ejemplo.com",
    "fechaActualizacion": "2025-12-10T..."
  }
}
```

#### DELETE /api/products/:id
Eliminar un producto (requiere autenticación y rol admin).

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
    "id": "product_id",
    "nombre": "Producto eliminado"
  },
  "deletedBy": "admin@ejemplo.com"
}
```

## Autenticación y Autorización

### Niveles de Protección

| Método | Endpoint | Protección | Rol Requerido |
|--------|----------|------------|---------------|
| GET | /api/products | Pública | Ninguno |
| GET | /api/products/:id | Pública | Ninguno |
| POST | /api/products/create | Protegida | Autenticado |
| PUT | /api/products/:id | Protegida | Autenticado |
| DELETE | /api/products/:id | Protegida | Admin |
| POST | /auth/login | Pública | Ninguno |
| GET | /auth/verify | Protegida | Autenticado |
| POST | /auth/refresh | Pública | Ninguno |
| GET | /auth/me | Protegida | Autenticado |

### Formato del Token

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer {tu_token_jwt}
```

### Roles Disponibles

- **admin**: Acceso completo a todas las operaciones
- **user**: Puede crear y actualizar productos, pero no eliminar

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

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

- `npm run start`: Inicia el servidor en modo producción
- `npm run dev`: Inicia el servidor con nodemon (reinicio automático en cambios)

## Configuración de Firebase

### Colecciones Requeridas

#### Colección: users

Estructura de documento:

```javascript
{
  email: "usuario@talentotech.com",
  password: "contraseña_hasheada", // En producción usar bcrypt
  nombre: "Nombre Completo",
  role: "user", // "admin" o "user"
  activo: true,
  fechaCreacion: Timestamp,
  fechaActualizacion: Timestamp
}
```

#### Colección: products

Estructura de documento:

```javascript
{
  nombre: "Nombre del Producto",
  precio: 100.00,
  stock: 10,
  descripcion: "Descripción del producto",
  activo: true,
  creadoPor: "usuario@talentotech.com",
  creadoPorId: "user_id",
  fechaCreacion: Timestamp,
  fechaActualizacion: Timestamp
}
```

### Reglas de Seguridad de Firestore

Para producción, configurar las siguientes reglas en Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reglas para productos
    match /products/{productId} {
      allow read: if true; // Lectura pública
      allow create, update: if request.auth != null; // Escritura solo autenticados
      allow delete: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Reglas para usuarios
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Seguridad

### Recomendaciones para Producción

1. **Contraseñas**: Implementar hashing con bcrypt
   ```bash
   npm install bcrypt
   ```

2. **JWT_SECRET**: Usar una clave de al menos 64 caracteres generada aleatoriamente

3. **HTTPS**: Servir la API únicamente sobre HTTPS

4. **CORS**: Configurar orígenes específicos en lugar de `*`
   ```javascript
   app.use(cors({
     origin: ['https://tu-frontend.com'],
     credentials: true
   }));
   ```

5. **Rate Limiting**: Implementar límites de peticiones
   ```bash
   npm install express-rate-limit
   ```

6. **Helmet**: Agregar headers de seguridad
   ```bash
   npm install helmet
   ```

7. **Variables de entorno**: Nunca versionar el archivo `.env`

8. **Validación de datos**: Implementar validación exhaustiva con express-validator

## Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| PORT | Puerto del servidor | 3000 |
| NODE_ENV | Entorno de ejecución | development / production |
| JWT_SECRET | Clave secreta para JWT | tu_clave_secreta_64_caracteres |
| FIREBASE_API_KEY | API Key de Firebase | AIzaSy... |
| FIREBASE_AUTH_DOMAIN | Dominio de autenticación | proyecto.firebaseapp.com |
| FIREBASE_PROJECT_ID | ID del proyecto Firebase | proyecto-id |
| FIREBASE_STORAGE_BUCKET | Bucket de almacenamiento | proyecto.appspot.com |
| FIREBASE_MESSAGING_SENDER_ID | ID del sender | 123456789 |
| FIREBASE_APP_ID | ID de la aplicación | 1:123:web:abc |

## Solución de Problemas

### Error: "Firebase not connected"

- Verificar que las credenciales en `.env` sean correctas
- Comprobar que Firebase Firestore esté habilitado en la consola
- Revisar las reglas de seguridad de Firestore

### Error: "Token inválido"

- Verificar que el token esté en el formato correcto: `Bearer {token}`
- Comprobar que el JWT_SECRET sea el mismo que se usó para generar el token
- El token puede haber expirado (validez de 24 horas)

### Error: "Producto no encontrado"

- Verificar que el ID del producto sea correcto
- Comprobar que el producto exista en Firebase Console

### Error al instalar dependencias

```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit de tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC.

## Contacto

Para preguntas o sugerencias sobre el proyecto, por favor abrir un issue en el repositorio.

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2025  
**Autor:** Marcelo Peralta / Estudiante Talento Tech