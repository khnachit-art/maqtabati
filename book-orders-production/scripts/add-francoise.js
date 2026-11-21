const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  let school = await prisma.school.findFirst({ where: { name: 'فرنسواز دولتو - الخميسات' } });
  if (!school) {
    school = await prisma.school.create({ data: { name: 'فرنسواز دولتو - الخميسات', region: 'الخميسات' } });
    console.log(`Created school: ${school.name} (id=${school.id})`);
  } else {
    console.log(`School already exists: ${school.name} (id=${school.id})`);
  }

  const books = [
    { title: "L'éclair du français CE2 (Livres + Cahier d'activités : 1 et 2)", subject: 'Français', level: 'CE2' },
    { title: "La chèvre de Mr Seguin", subject: 'Lecture', level: 'CE2' },
    { title: "Génie des Maths+ CE2", subject: 'Mathématiques', level: 'CE2' },
    { title: "La cité des sciences CE2", subject: 'Sciences', level: 'CE2' },
    { title: "Le petit programmeur - niveau 1", subject: 'Informatique', level: 'CE2' },
    { title: "Top kids - niveau 2", subject: 'Informatique', level: 'CE2' },
    { title: 'المفيد في اللغة العربية المستوى 3 اب', subject: 'Arabe', level: 'CE2' },
    { title: 'الممتاز في التربية الإسلامية 3 اب', subject: 'Islamique', level: 'CE2' },
    { title: 'المفيد في التربية التشكيلية 3 اب', subject: 'Arts', level: 'CE2' },
    { title: 'الواضح في النشاط العلمي 3 اب', subject: 'Sciences', level: 'CE2' },
    { title: 'المرجع في الرياضيات م 3 اب', subject: 'Mathématiques', level: 'CE2' },
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
