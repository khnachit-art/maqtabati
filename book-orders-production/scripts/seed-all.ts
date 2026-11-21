import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import path from "path";

const prisma = new PrismaClient();
const dir = String.raw`C:\Users\PC-PJD\Desktop\الدخول المدرسي\لوائح الكتب`;

const LEVEL_ORDER = [
  "CP","CE1","CE2","CM1","CM2","CE6",
  "1AC","2AC","3AC",
  "TC SC","1BAC SC EXP","1BAC SC MATHS","1BAC SC PC",
  "2BAC SC EXP","2BAC SC MATHS","2BAC SC PC",
];

function inferSubject(title: string): string {
  const t = title.toLowerCase();
  if (/calculator|cahier|carnet|dictionnaire| stylo|crayon|gomme|colle|papier|fourniture|ardoise|compas|r[eè]gle|taille-crayon|lutin|dossier|feuille|correcteur|calculatrice|meilleur en [eé]criture|bibliobus|le bibliobus|d[aà]mier/i.test(title)) return "__SKIP__";
  if (/fran[cç]ais|texte|litt[eé]rature|roman|lecture|grammaire|dict[eé]e|lecture suivie/i.test(title)) return "Français";
  if (/math[s]?|al[gè]br|analyse|g[eè]om[eè]tr|calcul|n[uú]m[eè]r|الرياضيات|المرجع في الرياض|الجيد في الرياض/i.test(title)) return "Mathématiques";
  if (/svt|science|biologie|archipel/i.test(title)) return "S.V.T";
  if (/physique|chimie|pc\b|etincelle|al moufid.*pc/i.test(title)) return "Physique-Chimie";
  if (/anglais|english|solutions|gateway|let's speak|on screen/i.test(title)) return "Anglais";
  if (/arabe|عربي|اللغة العربية|الرائد|مرشدي|منار اللغة|المفيد في اللغة|في رحاب اللغة|المنير في اللغة|الك[iي]تاب/i.test(title)) return "Arabe";
  if (/islam|تربية اسلام|الاسلام|الإسلام|إحياء|في رحاب التربية|فضاء التربية|منار التربية|المنار في التربية/i.test(title)) return "Éducation islamique";
  if (/histoire|hg|اجتماع|منار التاريخ|المسار التاريخ|كتاب منار|في رحاب الاجتماع/i.test(title)) return "Histoire-Géographie";
  if (/informatique|robot|la pensée informatique|evoluer en informatique/i.test(title)) return "Informatique";
  if (/philosophie|فلسفة/i.test(title)) return "Philosophie";
  if (/arti|تشكيل|فنية|dessin|peinture/i.test(title)) return "Éducation artistique";
  if (/eveil|نشاط علم|اكتشاف|découverte|mes apprentissages|الأساسي في|المختار في|الواضح في|المرشد في|المنهل في/i.test(title)) return "Eveils";
  return "Général";
}

function isNonBookRow(title: string): boolean {
  if (!title || title.trim().length === 0) return true;
  const t = title.trim();
  if (/^(type de cahier|couleur|article|livres requis|cahiers requis|couvertures requis|fournitures|cahier de|carnet|lutin|bloc-notes|papier)/i.test(t)) return true;
  if (t.length < 3) return true;
  return false;
}

// ALANDALOUSSIA
const andalousiaSheetMap: Record<string, string> = {
  "CP": "CP", "CE1": "CE1", "CE2": "CE2", "CM1": "CM1", "CM2": "CM2",
  "CE6": "CE6", "1AC": "1AC", "2AC": "2AC", "3AC": "3AC",
  "TCS": "TC SC", "1BAC Sc.Exp": "1BAC SC EXP", "1BAC Sc.Maths": "1BAC SC MATHS",
};

// Al Afak
const alAfakSheetMap: Record<string, string> = {
  "1APG (CP)": "CP", "2APG (CE1)": "CE1", "3APG (CE2)": "CE2",
  "4APG (CM1)": "CM1", "5APG (CM2)": "CM2", "6APG": "CE6",
  "1AC (1ère Collège)": "1AC", "2AC (2ème Collège)": "2AC", "3AC (3ème Collège)": "3AC",
  "TCS (Tronc Commun Sciences)": "TC SC",
  "1BAC SC.EXP": "1BAC SC EXP", "1BAC SC.MATH": "1BAC SC MATHS",
  "1BAC SEG (Éco)": "1BAC SEG ECO",
  "2BAC SC.PHYS": "2BAC SC PC", "2BAC SC.MATH": "2BAC SC MATHS",
  "2BAC SEG (Éco)": "2BAC SEG ECO",
};

// Nour El Houda
const nourSheetMap: Record<string, string> = {
  "1APG - CP": "CP", "2APG - CE1": "CE1", "3APG - CE2": "CE2",
  "4APG - CM1": "CM1", "5APG - CM2": "CM2", "6APG": "CE6",
  "1ACC - 1AC": "1AC", "2ACC - 2AC": "2AC", "3ACC - 3AC": "3AC",
  "TCSEF": "TC SC", "1BACSEF": "1BAC SC EXP", "1BACSCM": "1BAC SC MATHS",
  "2BACSCMF": "2BAC SC MATHS", "2BACSPF": "2BAC SC PC",
};

function readAndalousiaBooks(filePath: string): Map<string, { title: string; subject: string }[]> {
  const wb = XLSX.readFile(filePath);
  const result = new Map<string, { title: string; subject: string }[]>();

  for (const sheetName of wb.SheetNames) {
    const level = andalousiaSheetMap[sheetName];
    if (!level) continue;

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

    const books: { title: string; subject: string }[] = [];
    let inBooks = false;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const cell0 = String(row?.[0] ?? "").trim();

      if (/livres requis/i.test(cell0)) { inBooks = true; continue; }
      if (inBooks && (cell0 === "" || /cahiers requis|couvertures requis|fournitures/i.test(cell0))) break;
      if (!inBooks) continue;
      if (cell0.length < 3) continue;
      if (/^titres? du livre|^niveau|^prix/i.test(cell0)) continue;

      const title = cell0;
      const subject = inferSubject(title);
      if (subject === "__SKIP__") continue;
      books.push({ title, subject });
    }

    result.set(level, books);
  }
  return result;
}

function readAlAfakBooks(filePath: string): Map<string, { title: string; subject: string }[]> {
  const wb = XLSX.readFile(filePath);
  const result = new Map<string, { title: string; subject: string }[]>();

  for (const sheetName of wb.SheetNames) {
    const level = alAfakSheetMap[sheetName];
    if (!level) continue;

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

    const books: { title: string; subject: string }[] = [];
    let inBooks = false;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const cell0 = String(row?.[0] ?? "").trim();

      if (/livres requis/i.test(cell0)) { inBooks = true; continue; }
      if (inBooks && (cell0 === "" || /cahiers requis|fournitures|cahier de|carnet/i.test(cell0))) break;
      if (!inBooks) continue;
      if (cell0.length < 3) continue;
      if (/^titres? du livre|^type de cahier/i.test(cell0)) continue;

      const title = cell0;
      const subject = inferSubject(title);
      if (subject === "__SKIP__") continue;
      books.push({ title, subject });
    }

    result.set(level, books);
  }
  return result;
}

function readNourBooks(filePath: string): Map<string, { title: string; subject: string }[]> {
  const wb = XLSX.readFile(filePath);
  const result = new Map<string, { title: string; subject: string }[]>();

  for (const sheetName of wb.SheetNames) {
    const level = nourSheetMap[sheetName];
    if (!level) continue;

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

    const books: { title: string; subject: string }[] = [];
    let inBooks = false;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const cell0 = String(row?.[0] ?? "").trim();

      if (/الكتب المدرسية/i.test(cell0)) { inBooks = true; continue; }
      if (inBooks && (cell0 === "" || /الأدوات المدرسية/i.test(cell0))) break;
      if (!inBooks) continue;
      if (cell0.length < 3) continue;
      if (/^عنوان الكتاب|^البيان/i.test(cell0)) continue;

      const title = cell0;
      const subject = inferSubject(title);
      if (subject === "__SKIP__") continue;
      books.push({ title, subject });
    }

    result.set(level, books);
  }
  return result;
}

async function seedSchool(name: string, region: string, booksByLevel: Map<string, { title: string; subject: string }[]>) {
  const school = await prisma.school.upsert({
    where: { name },
    update: { region },
    create: { name, region },
  });

  console.log(`School: ${school.name} (id: ${school.id})`);
  let created = 0;
  let skipped = 0;

  const levels = Array.from(booksByLevel.keys()).sort(
    (a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b)
  );

  for (const level of levels) {
    const books = booksByLevel.get(level)!;
    console.log(`  Level ${level}: ${books.length} books`);

    for (const book of books) {
      const existing = await prisma.book.findFirst({
        where: { title: book.title, subject: book.subject, level, schoolId: school.id },
      });
      if (existing) { skipped++; continue; }
      await prisma.book.create({
        data: { title: book.title, subject: book.subject, level, schoolId: school.id },
      });
      created++;
    }
  }

  console.log(`  ${created} books created, ${skipped} skipped`);
}

async function main() {
  console.log("=== Importing books from Excel files ===\n");

  // First, clear existing books (reset)
  const count = await prisma.book.deleteMany({});
  console.log(`Cleared ${count.count} existing books\n`);

  // 1. ALANDALOUSSIA
  const andalousiaBooks = readAndalousiaBooks(path.join(dir, "Fournitures_Scolaires_ALANDALOUSSIA.xlsx"));
  await seedSchool("الأندلسية", "Khemisset", andalousiaBooks);
  console.log();

  // 2. Al Afak
  const alAfakBooks = readAlAfakBooks(path.join(dir, "Liste_Fournitures_Al_Afak_Style_Andaloussia_2026_2027.xlsx"));
  await seedSchool("مجموعة مدارس الآفاق (Groupe scolaire AL AFAK)", "Khemisset", alAfakBooks);
  console.log();

  // 3. Nour El Houda
  const nourBooks = readNourBooks(path.join(dir, "Nour_El_Houda_Lists.xlsx"));
  await seedSchool("نور الهدى (Nour El Houda)", "Khemisset", nourBooks);
  console.log();

  // Summary
  const schools = await prisma.school.findMany({ include: { _count: { select: { books: true } } } });
  console.log("=== Final state ===");
  for (const s of schools) {
    console.log(`  ${s.name}: ${s._count.books} books`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
