const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const duplicates = [
  { keep: 'Informatique Robotique & Intelligence Artificielle 3', remove: 'Informatique Robotique et Intelligence Artificielle 3' },
  { keep: 'Informatique Robotique & Intelligence Artificielle 4', remove: 'Informatique Robotique et Intelligence Artificielle 4' },
  { keep: 'Al mofid en mathématiques (1AC) 2020', remove: 'Al Moufid PC 1 AC' },
  { keep: 'ENGLISH IQ 1 SB + WB', remove: 'English IQ 1 AC' },
  { keep: 'Evoluer en informatique 1 AC', remove: 'Evoluer en informatique 1AC' },
  { keep: 'L\'univers plus physique chimie 1AC - manuel', remove: 'L\'univers plus physique chimie 1ère AC - manuel' },
  { keep: 'Oxygène Maths 1 AC', remove: 'Oxygène Maths 1AC' },
  { keep: 'Sigma 1 AC physique', remove: 'Sigma 1AC physique' },
  { keep: 'Evoluer en informatique 2 AC', remove: 'Evoluer en informatique 2AC' },
];

(async () => {
  for (const { keep, remove } of duplicates) {
    const keepBook = await prisma.book.findFirst({ where: { title: keep } });
    const removeBook = await prisma.book.findFirst({ where: { title: remove } });

    if (!keepBook) { console.log(`SKIP: "${keep}" not found`); continue; }
    if (!removeBook) { console.log(`SKIP: "${remove}" not found`); continue; }

    console.log(`Merging: "${remove}" (id=${removeBook.id}) -> "${keep}" (id=${keepBook.id})`);

    const items = await prisma.orderItem.findMany({ where: { bookId: removeBook.id } });
    console.log(`  Found ${items.length} order items to move`);

    for (const item of items) {
      const existing = await prisma.orderItem.findFirst({
        where: { orderId: item.orderId, bookId: keepBook.id },
      });
      if (existing) {
        await prisma.orderItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
        await prisma.orderItem.delete({ where: { id: item.id } });
        console.log(`  Merged item orderId=${item.orderId}: +${item.quantity} -> existing, deleted duplicate`);
      } else {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { bookId: keepBook.id },
        });
        console.log(`  Moved item orderId=${item.orderId}: qty=${item.quantity}`);
      }
    }

    await prisma.book.delete({ where: { id: removeBook.id } });
    console.log(`  Deleted book "${remove}" (id=${removeBook.id})`);
  }

  console.log('\nDone!');
  await prisma.$disconnect();
})();
