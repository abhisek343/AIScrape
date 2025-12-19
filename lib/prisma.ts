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

  if (!connectionString) {
    console.warn('DATABASE_URL environment variable is not set or empty - database features will be disabled');
    // Return a mock prisma client for development when DATABASE_URL is missing
    return {
      $connect: () => Promise.resolve(),
      $disconnect: () => Promise.resolve(),
    } as any;
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
