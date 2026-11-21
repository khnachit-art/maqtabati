import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const levels = [
  "CP1", "CP2", "CE1", "CE2", "CM1", "CM2",
  "6ème", "5ème", "4ème", "3ème",
  "2nde", "1ère", "Tle",
];

const subjectsByLevel: Record<string, string[]> = {
  "CP1": ["عربية", "رياضيات"],
  "CP2": ["عربية", "رياضيات"],
  "CE1": ["عربية", "رياضيات", "علوم"],
  "CE2": ["عربية", "رياضيات", "علوم", "فرنسية"],
  "CM1": ["عربية", "رياضيات", "علوم", "فرنسية"],
  "CM2": ["عربية", "رياضيات", "علوم", "فرنسية"],
  "6ème": ["عربية", "رياضيات", "علوم", "فرنسية", "تاريخ جغرافيا"],
  "5ème": ["عربية", "رياضيات", "علوم", "فرنسية", "تاريخ جغرافيا"],
  "4ème": ["عربية", "رياضيات", "علوم", "فرنسية", "تاريخ جغرافيا", "تقني رياضي"],
  "3ème": ["عربية", "رياضيات", "علوم", "فرنسية", "تاريخ جغرافيا", "تقني رياضي"],
  "2nde": ["عربية", "رياضيات", "علوم طبيعية", "فرنسية", "تاريخ جغرافيا", "تقني رياضي"],
  "1ère": ["عربية", "رياضيات", "علوم طبيعية", "فرنسية", "تاريخ جغرافيا", "تقني رياضي", "فلسفة"],
  "Tle": ["عربية", "رياضيات", "علوم طبيعية", "فرنسية", "تاريخ جغرافيا", "تقني رياضي", "فلسفة"],
};

const bookTitles: Record<string, string[]> = {
  "عربية": ["أنا أقرأ 1", "أنا أقرأ 2", "نحو واملاء", "بلاغة"],
  "رياضيات": ["الرياضيات للجميع 1", "الرياضيات للجميع 2", "تمارين رياضية"],
  "علوم": ["عالمنا الصغير 1", "عالمنا الصغير 2", "عمليات علمية"],
  "علوم طبيعية": ["عوالم الحياة", "علوم الطبيعة والحياة 1"],
  "فرنسية": ["Bien dire 1", "Bien dire 2", "Grammaire active"],
  "تاريخ جغرافيا": ["جذور المعرفة 1", "جذور المعرفة 2"],
  "تقني رياضي": ["المستقبل التقني 1", "المستقبل التقني 2"],
  "فلسفة": ["مقدمة في الفلسفة", "تمارين فلسفية"],
};

function pickTitle(subject: string, _level: string, idx: number): string {
  const titles = bookTitles[subject] ?? [subject];
  return titles[idx % titles.length];
}

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding books...");

  let count = 0;
  for (const level of levels) {
    const subjects = subjectsByLevel[level] ?? [];
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const title = pickTitle(subject, level, i);
      await prisma.book.create({
        data: { title, subject, level },
      });
      count++;
    }
  }

  console.log(`Seeded ${count} books.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
