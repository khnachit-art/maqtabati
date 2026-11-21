import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const schools = await prisma.school.findMany({
    include: { _count: { select: { books: true } } },
  });
  console.log("Schools:");
  for (const s of schools) {
    console.log(`  ${s.name} (id: ${s.id}) — ${s._count.books} books`);
  }

  const noSchool = await prisma.book.count({ where: { schoolId: null } });
  console.log(`\nBooks without schoolId: ${noSchool}`);

  const totalBooks = await prisma.book.count();
  console.log(`Total books: ${totalBooks}`);

  const totalOrders = await prisma.order.count();
  console.log(`Total orders: ${totalOrders}`);

  const users = await prisma.user.findMany({ select: { id: true, username: true, name: true } });
  console.log(`\nUsers: ${JSON.stringify(users)}`);
}

main().finally(() => prisma.$disconnect());
