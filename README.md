## 🐾 MyPet

**MyPet** es una plataforma web para la gestión integral de la salud de mascotas en Buenos Aires. Conecta a dueños de mascotas con veterinarias, centraliza el historial clínico y permite reservar y pagar turnos online.

### ¿Qué problema resuelve?

Hoy los dueños de mascotas pierden el historial clínico cada vez que cambian de veterinaria, no tienen forma fácil de comparar precios ni disponibilidad, y en situaciones de urgencia no saben a quién llamar. MyPet centraliza toda esa información en un solo lugar, accesible desde cualquier dispositivo.

### Roles de usuario

| Rol | Descripción |
|---|---|
| 🐶 **Dueño de mascota** | Registra sus mascotas, reserva y paga turnos, consulta el historial clínico y usa el foro de mascotas perdidas |
| 🩺 **Veterinaria / Profesional** | Gestiona su agenda, carga el historial clínico post-consulta y define sus servicios y precios |
| 🛡️ **Administrador** | Supervisa la plataforma, modera el foro y gestiona usuarios y veterinarias |


## 🛠️ Tech Stack

### Frontend
| Tecnología | Uso |
|---|---|
| **React 18** | Librería principal para la interfaz de usuario |
| **Vite** | Bundler y entorno de desarrollo |
| **React Router DOM** | Navegación y rutas del cliente |
| **Tailwind CSS** | Estilos y diseño responsive |

### Backend
| Tecnología | Uso |
|---|---|
| **Node.js** | Entorno de ejecución del servidor |
| **Express** | Framework para la API REST |
| **JWT (jsonwebtoken)** | Autenticación y autorización por roles |
| **bcrypt** | Encriptación de contraseñas |
| **Nodemailer** | Envío de emails de notificación |

### Base de datos
| Tecnología | Uso |
|---|---|
| **MongoDB Atlas** | Base de datos NoSQL en la nube |
| **Mongoose** | ODM para modelar los datos |

### Integraciones externas
| Servicio | Uso |
|---|---|
| **MercadoPago** | Pasarela de pagos para confirmar turnos |
| **Cloudinary** | Almacenamiento de imágenes de mascotas y foro |
| **Google Maps API** | Buscador de veterinarias con geolocalización |
| **Anthropic (Claude)** | Bot de IA para consultas de salud animal |

### Deploy
| Servicio | Uso |
|---|---|
| **Vercel** | Deploy del frontend |
| **Render** | Deploy del backend |

## 👥 Equipo

| Nombre | Rol |
|---|---|
| **Mauricio Soto** | Project Manager |
| **Camila Villasboa** | Project Manager |
| **Angeles Piris** | Frontend |
| **Romina Castro** | Frontend |
| **Agustin Reboliz** | Frontend |
| **Gaston Vilte** | Backend |
| **Maria Lujan Lezcano** | Backend |
| **Nicolás Origlia** | Backend |
| **Sofia Juanco** | Diseño UX/UI |
| **Carolina Cottini** | Full Stack |


## ✅ Requisitos previos

Antes de clonar y correr el proyecto asegurate de tener instalado lo siguiente:

| Herramienta | Versión recomendada | Descarga |
|---|---|---|
| **Node.js** | v18 o superior | [nodejs.org](https://nodejs.org) |
| **npm** | v9 o superior | Viene incluido con Node.js |
| **Git** | Última versión estable | [git-scm.com](https://git-scm.com) |

Para verificar que los tenés instalados correctamente podés correr estos comandos en tu terminal:

```bash
node --version
npm --version
git --version
```

También vas a necesitar:

- Una cuenta en **MongoDB Atlas** para crear tu base de datos local → [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Una cuenta en **Cloudinary** para almacenamiento de imágenes → [cloudinary.com](https://cloudinary.com)
- Credenciales de **MercadoPago sandbox** para pagos de prueba → [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
- Una **API key de Google Maps** → [console.cloud.google.com](https://console.cloud.google.com)
- Una **API key de Anthropic** para el bot de IA → [console.anthropic.com](https://console.anthropic.com)


## 🚀 Instalación y uso local

### 1. Clonar el repositorio

```bash
git clone https://github.com/usuario/mypet.git
cd mypet
```

### 2. Configurar las variables de entorno

**Backend:**
```bash
cd server
cp .env.example .env
```

**Frontend:**
```bash
cd client
cp .env.example .env
```

Abrí cada archivo `.env` y completá las variables con tus propias credenciales. Consultá la sección [Variables de entorno](#️-variables-de-entorno) para saber qué valor va en cada una.

### 3. Instalar dependencias

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 4. Correr el proyecto

Necesitás abrir **dos terminales** al mismo tiempo, una para el backend y otra para el frontend.

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

### 5. Abrir en el navegador

Una vez que ambos estén corriendo, abrí tu navegador en:

```
http://localhost:5173
```

> ⚠️ El backend corre por defecto en el puerto `5000`. Si se necesitá cambiar, modificar la variable `PORT` en el archivo `.env` del servidor.


## ⚙️ Variables de entorno

### Server — `/server/.env`

```bash
# Base de datos
MONGODB_URI=           # URL de conexión a tu cluster de MongoDB Atlas

# Autenticación
JWT_SECRET=            # Texto secreto para firmar los tokens JWT (puede ser cualquier string largo)
JWT_EXPIRES_IN=        # Tiempo de expiración del token. Ejemplo: 7d, 24h

# MercadoPago
MP_ACCESS_TOKEN=       # Access token de tu cuenta sandbox de MercadoPago
MP_PUBLIC_KEY=         # Public key de tu cuenta sandbox de MercadoPago

# Cloudinary
CLOUDINARY_CLOUD_NAME= # Nombre de tu cuenta en Cloudinary
CLOUDINARY_API_KEY=    # API key de Cloudinary
CLOUDINARY_API_SECRET= # API secret de Cloudinary

# Google Maps
GOOGLE_MAPS_API_KEY=   # API key de Google Maps (solo para uso en el servidor)

# Anthropic (Bot IA)
ANTHROPIC_API_KEY=     # API key de Anthropic para el bot de salud animal

# Email (Nodemailer)
EMAIL_USER=            # Dirección de Gmail que va a enviar los emails
EMAIL_PASSWORD=        # Contraseña de aplicación de Gmail (no la contraseña normal)
EMAIL_FROM=            # Nombre y dirección que aparece como remitente. Ejemplo: MyPet <noreply@mypet.com>

# Servidor
PORT=                  # Puerto donde corre el servidor. Ejemplo: 5000
FRONTEND_URL=          # URL del frontend. En local: http://localhost:5173
```

### Client — `/client/.env`

```bash
# URL del backend
VITE_API_URL=              # URL de tu backend. En local: http://localhost:5000

# Google Maps (clave pública para el frontend)
VITE_GOOGLE_MAPS_API_KEY=  # API key de Google Maps para mostrar el mapa en el navegador

# MercadoPago (clave pública para el frontend)
VITE_MP_PUBLIC_KEY=        # Public key de MercadoPago para el checkout en el navegador
```

> ⚠️ **Importante:** Nunca subas el archivo `.env` al repositorio. Ya está incluido en el `.gitignore`. Las variables que empiezan con `VITE_` son las únicas que puede leer el frontend — cualquier variable sin ese prefijo es invisible para React.


## 📁 Estructura de carpetas

```
mypet/
│
├── client/                         # Frontend — React + Vite
│   ├── public/                     # Archivos estáticos
│   ├── src/
│   │   ├── components/             # Componentes reutilizables (Navbar, Button, Card, etc.)
│   │   ├── pages/                  # Páginas de la aplicación (Login, Home, Perfil, etc.)
│   │   ├── hooks/                  # Custom hooks de React
│   │   ├── services/               # Llamadas a la API del backend
│   │   ├── context/                # Context API para estado global (auth, usuario)
│   │   ├── utils/                  # Funciones auxiliares
│   │   └── App.jsx                 # Componente raíz y configuración de rutas
│   ├── .env                        # Variables de entorno del frontend (no subir)
│   ├── .env.example                # Plantilla de variables de entorno
│   └── vite.config.js              # Configuración de Vite
│
├── server/                         # Backend — Node.js + Express
│   ├── controllers/                # Lógica de cada endpoint
│   ├── models/                     # Modelos de MongoDB con Mongoose
│   ├── routes/                     # Definición de rutas de la API
│   ├── middleware/                 # Middlewares (auth JWT, roles, errores)
│   ├── utils/                      # Funciones auxiliares (email, cloudinary, etc.)
│   ├── .env                        # Variables de entorno del backend (no subir)
│   ├── .env.example                # Plantilla de variables de entorno
│   └── index.js                    # Punto de entrada del servidor
│
├── docs/                           # Documentación del proyecto
│   ├── modelo-datos.md             # Colecciones de MongoDB y sus relaciones
│   └── endpoints.md                # Lista completa de endpoints de la API
│
├── .gitignore                      # Archivos ignorados por Git
└── README.md                       # Este archivo
```


## 🔗 Links importantes

| Recurso | Link |
|---|---|
| 🌐 **Deploy frontend (producción)** | Proximamente |
| ⚙️ **Deploy backend (producción)** | Proximamente |
| 🎨 **Figma — Diseño y wireframes** | https://www.figma.com/design/hneHMdvN05Wt6I6eFr0pW5/Untitled?node-id=0-1&t=HsOe6wKVwlavGsRf-0 |
| 📋 **Trello — Tablero de tareas** | https://trello.com/b/71fl6GoF/proyecto-pescar |
| 🐙 **Repositorio GitHub** | https://github.com/proyecto-final-pescar/app-sistemas |

## 🌿 Metodología de trabajo

Este proyecto usa **GitHub Flow** como metodología de trabajo con ramas.

- La rama `main` contiene el código de producción. **Nunca se pushea directo a main.**
- La rama `develop` es la rama principal de desarrollo.
- Cada integrante crea su propia rama desde `develop` para trabajar en su tarea.

### Convención para nombres de ramas

```
feature/nombre-de-la-tarea
```

Ejemplos:
```
feature/login-usuario
feature/crud-mascotas
feature/pasarela-pagos
```

### Flujo de trabajo

```
1. Crear rama desde develop
   git checkout develop
   git pull origin develop
   git checkout -b feature/nombre-de-la-tarea

2. Trabajar en la tarea y hacer commits
   git add .
   git commit -m "descripción clara del cambio"

3. Subir la rama al repositorio
   git push origin feature/nombre-de-la-tarea

4. Abrir un Pull Request hacia develop en GitHub

5. Esperar revisión y aprobación antes de mergear
```

> ⚠️ No mergear tu propio Pull Request. Siempre esperar que otro integrante lo revise.