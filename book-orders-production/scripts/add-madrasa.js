const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  let school = await prisma.school.findFirst({ where: { name: 'المدرسة العسكرية - إقران' } });
  if (!school) {
    school = await prisma.school.create({ data: { name: 'المدرسة العسكرية - إقران', region: 'الخميسات' } });
    console.log(`Created school: ${school.name} (id=${school.id})`);
  } else {
    console.log(`School already exists: ${school.name} (id=${school.id})`);
  }

  const books = [
    { title: 'فضاء التربية الإسلامية 1 إع', subject: 'Islamique', level: '1AC' },
    { title: 'UNIVERS PLUS 1AC', subject: 'Français', level: '1AC' },
    { title: 'الرائد في اللغة العربية 1 إع', subject: 'Arabe', level: '1AC' },
    { title: 'PARCOURS 1AC', subject: 'Français', level: '1AC' },
    { title: 'PHYSIQUE CHIMIE COLLECTION COMPETENCE 1AC', subject: 'Sciences', level: '1AC' },
    { title: 'في رحاب الاجتماعيات 1 إع', subject: 'Général', level: '1AC' },
    { title: "@nous l'informatique 1AC", subject: 'Informatique', level: '1AC' },
    { title: 'المفيد في الرياضيات 1 إع', subject: 'Mathématiques', level: '1AC' },
    { title: 'English Spotlight 1AC : SB+ AB', subject: 'Anglais', level: '1AC' },
  ];

  for (const b of books) {
    const existing = await prisma.book.findFirst({ where: { title: b.title, schoolId: school.id } });
    if (existing) {
      console.log(`SKIP (exists): "${b.title}"`);
      continue;
    }
    const created = await prisma.book.create({ data: { ...b, schoolId: school.id } });
    console.log(`Created: "${created.title}" (${created.level}, id=${created.id})`);
  }

  console.log('\nDone!');
  await prisma.$disconnect();
})();
