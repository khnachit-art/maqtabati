import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.book.deleteMany({ where: { schoolId: null } });
  console.log(`Deleted ${deleted.count} orphaned books (no schoolId)`);
  const remaining = await prisma.book.count();
  console.log(`Remaining books: ${remaining}`);
}

main().finally(() => prisma.$disconnect());
