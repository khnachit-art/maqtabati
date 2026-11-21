const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");

const prisma = new PrismaClient();

const EXCEL_PATH = "C:\\Users\\PC-PJD\\Desktop\\الدخول المدرسي\\لائحة الكتب المطلوبة من كل مؤسسة.xlsx";

const LEVEL_MAP = {
  "PS": "PS", "MS": "MS", "GS": "GS",
  "CP": "CP", "CE1": "CE1", "CE2": "CE2",
  "CM1": "CM1", "CM2": "CM2", "CE6": "CE6",
  "1AC": "1AC", "2AC": "2AC", "3AC": "3AC",
  "TCS": "TC SC",
  "1 BAC SC.EXP": "1BAC SC EXP", "1BAC SC.EXP": "1BAC SC EXP",
  "1 BAC SC.Maths": "1BAC SC MATHS", "1BAC SC.Maths": "1BAC SC MATHS",
  "2 BAC SC.PHYS": "2BAC SC PC", "2BAC SC.PHYS": "2BAC SC PC",
  "2 BAC SC.Maths": "2BAC SC MATHS", "2BAC SC.Maths": "2BAC SC MATHS",
  "Antigone": "1BAC SC EXP",
  "Candide": "2BAC SC PC",
};

function inferSubject(title) {
  const t = title.toLowerCase();
  if (/arabe|عربي|اللغة العربية|الرائد|مرشدي|منار اللغة|المفيد في اللغة|في رحاب اللغة|المنير في اللغة|كتابي في اللغة|كتاب الرائد/.test(t)) return "Arabe";
  if (/fran[cç]ais|texte|litt[eé]rature|roman|lecture|grammaire|dict[eé]e|lecture suivie|vivre le français|archiple des mots|boîte aux lettres|nénuphar|passerelles|le temps des maths|le français au collège/.test(t)) return "Français";
  if (/math|رياضيات|حساب|géométrie|algèbre/.test(t)) return "Mathématiques";
  if (/anglais|english|speak english|super minds|on screen|gateway/.test(t)) return "Anglais";
  if (/islam|التربية الإسلامية|في رحاب التربية الاسلامية|المرجع في التربية الإسلامية|منار التربية الإسلامية/.test(t)) return "Éducation islamique";
  if (/science|نشاط علمي|الأساسي في النشاط|actif|investigation|éveil scientifique|en sciences|pensée informatique|informatique|robotique|calculator/.test(t)) return "Informatique";
  if (/physique| chimie|cdpl|archipel de physique|archipel de chimie|moufid en chimie|moufid en physique|maxi maths/.test(t)) return "Physique-Chimie";
  if (/svt|etincelle|panorama/.test(t)) return "S.V.T";
  if (/social|اجتماعيات|منار الاجتماعيات|جديد في الاجتماعيات|مسار التاريخ|التجديد في الاجتماعيات/.test(t)) return "Histoire-Géographie";
  if (/philosophie|فلسفة/.test(t)) return "Philosophie";
  if (/musique|la musique/.test(t)) return "Éducation musicale";
  if (/art|فن|تشكيلية|ال التربية الفنية|المنير في التربية الفنية|عالم التربية|عالم التربية الفنية|عالم التربية التشكيلية|la petite poule|bibliobus/.test(t)) return "Éducation artistique";
  if (/vie|مهارات حياتية/.test(t)) return "Éveils";
  return "Général";
}

function isLevelHeader(val) {
  const v = val.trim();
  if (LEVEL_MAP[v] !== undefined) return true;
  if (/^\d?\s*BAC/i.test(v)) return true;
  return false;
}

function normalizeLevel(val) {
  const v = val.trim();
  if (LEVEL_MAP[v]) return LEVEL_MAP[v];
  if (/1\s*BAC\s*SC\s*EXP/i.test(v)) return "1BAC SC EXP";
  if (/1\s*BAC\s*SC\s*MATHS/i.test(v)) return "1BAC SC MATHS";
  if (/2\s*BAC\s*SC\s*(PHYS|PC)/i.test(v)) return "2BAC SC PC";
  if (/2\s*BAC\s*SC\s*MATHS/i.test(v)) return "2BAC SC MATHS";
  return v;
}

async function main() {
  console.log("Reading Excel:", EXCEL_PATH);
  const wb = XLSX.readFile(EXCEL_PATH);
  console.log("Sheets:", wb.SheetNames);

  console.log("Clearing existing data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.book.deleteMany();
  await prisma.school.deleteMany();
  await prisma.user.deleteMany();

  const schools = [
    { name: "مؤسسة الفردوس - الخميسات", region: "الخميسات" },
    { name: "الأندلسية - الخميسات", region: "الخميسات" },
    { name: "مؤسسة الأفاق - الخميسات", region: "الخميسات" },
    { name: "مؤسسة نور الهدى - الخميسات", region: "الخميسات" },
  ];

  const schoolMap = {};
  for (const s of schools) {
    const created = await prisma.school.create({ data: s });
    schoolMap[s.name] = created.id;
    console.log(`Created school: ${s.name} (id: ${created.id})`);
  }

  let totalBooks = 0;

  for (const sheetName of wb.SheetNames) {
    const schoolId = schoolMap[sheetName];
    if (!schoolId) {
      console.log(`Skipping unknown sheet: ${sheetName}`);
      continue;
    }

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    let currentLevel = "";
    let bookCount = 0;

    for (const row of data) {
      const val = (row[0] || "").toString().trim();
      if (!val) continue;

      if (isLevelHeader(val)) {
        currentLevel = normalizeLevel(val);
        continue;
      }

      if (currentLevel) {
        const subject = inferSubject(val);
        await prisma.book.create({
          data: {
            title: val,
            subject,
            level: currentLevel,
            schoolId,
          },
        });
        bookCount++;
      }
    }

    totalBooks += bookCount;
    console.log(`${sheetName}: ${bookCount} books imported`);
  }

  console.log(`\nDone! Total books imported: ${totalBooks}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
