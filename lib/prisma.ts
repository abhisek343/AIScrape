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

  // The Neon adapter speaks WebSockets and cannot connect to a regular
  // PostgreSQL service such as the local Compose `postgres` container.
  // Keep the adapter for Neon deployments, but use Prisma's native engine
  // everywhere else.
  if (/neon\.tech/i.test(connectionString)) {
    const pool = new Pool({ connectionString });
    // @ts-ignore Potentially a type incompatibility between Neon Pool and PrismaNeon adapter
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter });
  }

  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
