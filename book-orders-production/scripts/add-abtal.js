const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  let school = await prisma.school.findFirst({ where: { name: 'أبطال الغد - الخميسات' } });
  if (!school) {
    school = await prisma.school.create({ data: { name: 'أبطال الغد - الخميسات', region: 'الخميسات' } });
    console.log(`Created school: ${school.name} (id=${school.id})`);
  } else {
    console.log(`School already exists: ${school.name} (id=${school.id})`);
  }

  const books = [
    { title: 'مرشدي في اللغة العربية 2 اب', subject: 'Arabe', level: 'CE1' },
    { title: "L'éclaire du français CE1 (Manuel + cahiers d'Activités 1 et 2)", subject: 'Français', level: 'CE1' },
    { title: "Let's Speak English 2 SB+WB", subject: 'Anglais', level: 'CE1' },
    { title: 'الجيد في الرياضيات 2 اب', subject: 'Mathématiques', level: 'CE1' },
    { title: 'Nouvelle Collection la réussite 2 Nouveau programme', subject: 'Français', level: 'CE1' },
    { title: 'المختار في النشاط العلمي 2 اب', subject: 'Sciences', level: 'CE1' },
    { title: 'مرشدي في التربية الإسلامية الثاني ابتدائي 2 اب', subject: 'Islamique', level: 'CE1' },
    { title: 'المختار في التربية الفنية 2 اب', subject: 'Arts', level: 'CE1' },
    { title: 'Micro-informatique et robotique CE1', subject: 'Informatique', level: 'CE1' },

    { title: 'المفيد في اللغة العربية 4 اب', subject: 'Arabe', level: 'CM1' },
    { title: "L'éclaire du français CM1 (Manuel + cahiers d'Activités 1-2)", subject: 'Français', level: 'CM1' },
    { title: "Let's Speak English 4 : SB+WB", subject: 'Anglais', level: 'CM1' },
    { title: 'المفيد في الرياضيات 4 اب', subject: 'Mathématiques', level: 'CM1' },
    { title: 'Micro Maths (CM1)', subject: 'Mathématiques', level: 'CM1' },
    { title: 'المنير في النشاط العلمي 4 اب', subject: 'Sciences', level: 'CM1' },
    { title: 'Les Cracks+ en Sciences CM1', subject: 'Sciences', level: 'CM1' },
    { title: 'الجديد في الاجتماعيات 4 اب', subject: 'Général', level: 'CM1' },
    { title: 'المنير في التربية الإسلامية 4 اب', subject: 'Islamique', level: 'CM1' },
    { title: 'المعتمد في التربية التشكيلية 4 اب', subject: 'Arts', level: 'CM1' },
    { title: 'Micro-informatique et robotique CM1', subject: 'Informatique', level: 'CM1' },
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
