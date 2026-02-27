const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findFirst();
    console.log('--- FOUND ORDER ID ---');
    console.log(order ? order.id : 'NONE');
    console.log('----------------------');
    process.exit(0);
}
main();
