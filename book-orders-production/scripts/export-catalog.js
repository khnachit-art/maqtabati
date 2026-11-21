const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

(async () => {
  const prisma = new PrismaClient();

  const schools = await prisma.school.findMany({
    include: { books: { orderBy: { level: 'asc' } } },
    orderBy: { name: 'asc' },
  });

  const wb = XLSX.utils.book_new();

  for (const school of schools) {
    if (school.books.length === 0) continue;

    const rows = [
      ['المستوى', 'العنوان', 'المادة'],
    ];

    for (const book of school.books) {
      rows.push([book.level, book.title, book.subject]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 16 }, { wch: 60 }, { wch: 15 }];
    ws['!rtl'] = true;

    const sheetName = school.name.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    console.log(`${school.name}: ${school.books.length} books`);
  }

  XLSX.writeFile(wb, 'catalogue-ecoles.xlsx');
  console.log('\nDone! Saved as catalogue-ecoles.xlsx');
  await prisma.$disconnect();
})();
