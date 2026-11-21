const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const school = await prisma.school.findFirst({ where: { name: 'مؤسسة الأفاق - الخميسات' } });
  if (!school) { console.log('School not found!'); await prisma.$disconnect(); return; }

  const existing = await prisma.book.findFirst({ where: { title: 'CDPL SVT 2bac Sc.Maths', schoolId: school.id } });
  if (existing) { console.log('Book already exists!'); await prisma.$disconnect(); return; }

  const created = await prisma.book.create({ data: { title: 'CDPL SVT 2bac Sc.Maths', subject: 'Sciences', level: '2BAC SC MATHS', schoolId: school.id } });
  console.log(`Created: "${created.title}" (${created.level}, id=${created.id})`);
  await prisma.$disconnect();
})();
