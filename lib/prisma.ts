import ws from 'ws';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless'; // Removed PoolConfig import

const prismaClientSingleton = () => {
  neonConfig.webSocketConstructor = ws;
  let connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    connectionString = connectionString.trim();
    if (connectionString.startsWith('"') && connectionString.endsWith('"')) {
      connectionString = connectionString.substring(1, connectionString.length - 1);
    }
  }

  console.log('Trimmed DATABASE_URL in prisma.ts:', connectionString); // Log the potentially cleaned string

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set or empty');
  }

  const pool = new Pool({ connectionString });
  // @ts-ignore Potentially a type incompatibility between Neon Pool and PrismaNeon adapter
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  return prisma;
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
