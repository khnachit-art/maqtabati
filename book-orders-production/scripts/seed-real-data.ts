import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const schools = [
  { name: "الأندلسية", region: "الجزائر" },
  { name: "الآفاق", region: "الجزائر" },
  { name: "رياض المعرفة", region: "الجزائر" },
  { name: "مؤسسة نور الهدى", region: "الجزائر" },
  { name: "واحة السلام", region: "الجزائر" },
];

async function main() {
  console.log("=== Starting seed ===\n");

  // 1. Create schools
  console.log("Creating schools...");
  for (const school of schools) {
    await prisma.school.upsert({
      where: { name: school.name },
      update: { region: school.region },
      create: school,
    });
    console.log(`  + ${school.name} (${school.region})`);
  }

  // 2. Seed books from clean-seed.json
  const seedPath = path.join(__dirname, "clean-seed.json");
  const books: Array<{ title: string; subject: string; level: string }> = JSON.parse(
    fs.readFileSync(seedPath, "utf-8")
  );

  console.log(`\nSeeding ${books.length} books...`);

  let created = 0;
  let skipped = 0;

  for (const book of books) {
    try {
      await prisma.book.create({
        data: {
          title: book.title,
          subject: book.subject,
          level: book.level,
        },
      });
      created++;
    } catch (e: any) {
      if (e.code === "P2002") {
        skipped++;
      } else {
        console.error(`  ERROR: ${book.title}: ${e.message}`);
      }
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped (duplicates)`);
  console.log(`Schools: ${schools.length}`);
  console.log(`Books: ${created}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
