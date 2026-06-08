# Configuración del Backend y Base de Datos

Este documento detalla los pasos necesarios para configurar el entorno local del backend y la conexión con MongoDB Atlas.

## 1. Requisitos previos 
- Node.js instalado.
- Haber clonado el repositorio y ubicarse en la carpeta `/server`. (!)Importante

## 2. Configuración del entorno
1. Te paras dentro de `/server`:
	a. con el bash en modo administrador, ejecutar 'npm install', 
	b. copia el archivo `.env.example`, lo pegas en la misma carpeta (`/server`) y renómbralo a `.env`:
```bash
   cp .env.example .env
Aclaración: No borres el .env.example.

## 3. Último paso
1. Edita el archivo '.env' y en la línea que dice 'MONGODB_URI=' seguido del 'igual' coloca connection string que te va a pasar Gastón Vilte.
Ej: 
	- MONGODB_URI=mongodb+srv://adminmypet:contraseña@veterinary-db.wbi9auh.mongodb.net/?appName=veterinary-db

##! Aclaración final
El archivo .env tiene información sensible, por ende, NO lo subas nunca al repositorio. Ya está configurado para ser ignorado por Git.

Cualquier duda, consultar a Gastón!
Listo! ;)