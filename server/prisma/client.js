import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Abre la conexión y corre una query trivial para que el handshake TLS con
// Postgres ocurra al arrancar el server y no en la primera request de un usuario
export async function connectDB() {
  await prisma.$connect()
  await prisma.$queryRaw`SELECT 1`
  console.log('[db] conexión a Postgres lista')
}

export async function disconnectDB() {
  await prisma.$disconnect()
}

export default prisma