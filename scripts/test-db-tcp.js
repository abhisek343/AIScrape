"use strict";
// import dotenv from 'dotenv';
// dotenv.config();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: ['query', 'info', 'warn', 'error']
});
async function main() {
    console.log('Testing standard TCP database connection...');
    console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);
    try {
        const start = Date.now();
        const workflows = await prisma.workflow.findMany({
            take: 1
        });
        console.log('Successfully connected to database via TCP.');
        console.log(`Query took ${Date.now() - start}ms`);
        console.log('Workflows found:', workflows.length);
    }
    catch (error) {
        console.error('Failed to connect to database via TCP:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
