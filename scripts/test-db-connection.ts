import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function main() {
    console.log('Testing database connection (Adapter/WS)...');
    console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);

    try {
        const start = Date.now();
        const workflows = await prisma.workflow.findMany({
            take: 1
        });
        console.log('Successfully connected to database.');
        console.log(`Query took ${Date.now() - start}ms`);
        console.log('Workflows found:', workflows.length);
    } catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    } finally {
        // await prisma.$disconnect(); 
        // access to disconnect might be hidden by lib/prisma logic or purely implementation detail of the singleton return
        // but the singleton returns 'prisma' which is PrismaClient, so $disconnect exists.
        if ('$disconnect' in prisma) {
            await (prisma as any).$disconnect();
        }
    }
}

main();
