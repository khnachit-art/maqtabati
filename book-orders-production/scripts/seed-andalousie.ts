import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const levels = [
  {
    level: "CP",
    books: [
      { subject: "Français", title: "Le nouveau vivre le français 1 : Livre unique + Cahiers d'activités (1 et 2) + Cahier d'écriture" },
      { subject: "العربية", title: "المفيد في اللغة العربية كتاب التلميذ السنة الأولى" },
      { subject: "العربية", title: "المفيد في اللغة العربية كراسة التعبير، السنة الأولى" },
      { subject: "التربية التشكيلية", title: "عالم التربية التشكيلية السنة الأولى" },
      { subject: "التربية الإسلامية", title: "المفيد في التربية الإسلامية السنة الأولى" },
      { subject: "Mathématique", title: "المفيد في الرياضيات" },
      { subject: "Informatique", title: "Robotique & Intelligence Artificielle 1" },
      { subject: "Eveils", title: "الأساسي في النشاط العلمي" },
      { subject: "Eveils", title: "ABC en sciences 1" },
    ],
  },
  {
    level: "CE1",
    books: [
      { subject: "Français", title: "Le nouveau vivre le français 2 : Livre unique + Cahiers d'activités (1 et 2) + Cahier d'écriture" },
      { subject: "العربية", title: "مرشدي في اللغة العربية" },
      { subject: "التربية التشكيلية", title: "المنير في التربية التشكيلية" },
      { subject: "التربية الإسلامية", title: "الممتاز في التربية الإسلامية" },
      { subject: "Mathématique", title: "المرجع في الرياضيات" },
      { subject: "Informatique", title: "Robotique & Intelligence Artificielle 2" },
      { subject: "Eveils", title: "المختار في النشاط العلمي" },
      { subject: "Eveils", title: "ABC en sciences 2" },
    ],
  },
  {
    level: "CE2",
    books: [
      { subject: "Français", title: "Le nouveau vivre le français 3 : Livre unique + Cahiers d'activités (1 et 2) + Cahier d'écriture" },
      { subject: "العربية", title: "المفيد في اللغة العربية" },
      { subject: "التربية التشكيلية", title: "المفيد في التربية التشكيلية" },
      { subject: "التربية الإسلامية", title: "الممتاز في التربية الإسلامية" },
      { subject: "Mathématique", title: "المرجع في الرياضيات" },
      { subject: "Informatique", title: "Robotique & Intelligence Artificielle 3" },
      { subject: "Eveils", title: "منهل في النشاط العلمي" },
      { subject: "Eveils", title: "ABC en sciences 3" },
    ],
  },
  {
    level: "CM1",
    books: [
      { subject: "Français", title: "Le nouveau vivre le français 4 : Livre unique + Cahiers d'activités (1 et 2)" },
      { subject: "العربية", title: "المفيد في اللغة العربية" },
      { subject: "التربية التشكيلية", title: "المفيد في التربية التشكيلية" },
      { subject: "التربية الإسلامية", title: "المنير في التربية الإسلامية" },
      { subject: "الاجتماعيات", title: "الجديد في الاجتماعيات" },
      { subject: "Mathématique", title: "الجيد في الرياضيات" },
      { subject: "Informatique", title: "Robotique & Intelligence Artificielle 4" },
      { subject: "Eveils", title: "المنير في النشاط العلمي" },
      { subject: "Eveils", title: "ABC en sciences 4" },
    ],
  },
  {
    level: "CM2",
    books: [
      { subject: "Français", title: "Le nouveau vivre le français 5 : Livre unique + Cahiers d'activités (1 et 2)" },
      { subject: "العربية", title: "المنير في اللغة العربية" },
      { subject: "التربية التشكيلية", title: "المنير في التربية التشكيلية" },
      { subject: "التربية الإسلامية", title: "الممتاز في التربية الإسلامية" },
      { subject: "الاجتماعيات", title: "الجديد في الاجتماعيات" },
      { subject: "Mathématique", title: "المفيد في الرياضيات" },
      { subject: "Informatique", title: "Robotique & Intelligence Artificielle 5" },
      { subject: "Eveils", title: "المنير في النشاط العلمي" },
      { subject: "Eveils", title: "ABC en sciences 5" },
    ],
  },
  {
    level: "CE6",
    books: [
      { subject: "Français", title: "Le nouveau vivre le français 6 : Livre unique + Cahiers d'activités (1 et 2)" },
      { subject: "Français", title: "Mes apprentissages en français (6ème année public)" },
      { subject: "العربية", title: "في رحاب اللغة العربية" },
      { subject: "التربية التشكيلية", title: "الممتاز في التربية التشكيلية" },
      { subject: "التربية الإسلامية", title: "المنير في التربية الإسلامية" },
      { subject: "الاجتماعيات", title: "الجديد في الاجتماعيات" },
      { subject: "Mathématique", title: "الجيد في الرياضيات" },
      { subject: "Informatique", title: "Robotique & Intelligence Artificielle 6" },
      { subject: "Eveils", title: "المفيد في النشاط العلمي" },
      { subject: "Eveils", title: "ABC en sciences 6" },
    ],
  },
  {
    level: "1AC",
    books: [
      { subject: "Français", title: "Texto Collège Hachette 1AC" },
      { subject: "Français", title: "Lecture suivie: Le Vendredi ou la vie sauvage (Michel Tournier)" },
      { subject: "Arabe", title: "المفيد في اللغة العربية" },
      { subject: "Mathématiques", title: "Oxygène Maths 1AC" },
      { subject: "Physique-Chimie", title: "Al Moufid PC 1AC" },
      { subject: "Education islamique", title: "فضاء التربية الإسلامية" },
      { subject: "Anglais", title: "English IQ 1AC" },
      { subject: "Informatique", title: "Evoluer en informatique 1AC" },
      { subject: "H.G", title: "في رحاب الاجتماعيات" },
    ],
  },
  {
    level: "2AC",
    books: [
      { subject: "Français", title: "Texto Collège Hachette 2AC" },
      { subject: "Français", title: "Roman: Aux champs" },
      { subject: "Arabe", title: "مرشدي في اللغة العربية" },
      { subject: "Physique-Chimie", title: "Al Moufid PC 2AC" },
      { subject: "Education islamique", title: "إحياء التربية الإسلامية" },
      { subject: "Anglais", title: "English IQ 2AC" },
      { subject: "Informatique", title: "Evoluer en informatique 2AC" },
      { subject: "H.G", title: "منار الاجتماعيات" },
    ],
  },
  {
    level: "3AC",
    books: [
      { subject: "Français", title: "Texto Collège Hachette 3AC" },
      { subject: "Français", title: "Passerelle (livre de l'école publique)" },
      { subject: "Arabe", title: "مرشدي في اللغة العربية" },
      { subject: "Mathématiques", title: "Oxygène Maths 3AC" },
      { subject: "Education islamique", title: "منار التربية الإسلامية" },
      { subject: "Anglais", title: "English IQ 3AC" },
      { subject: "Informatique", title: "Evoluer en informatique 3AC" },
      { subject: "H.G", title: "التجديد في الاجتماعيات" },
    ],
  },
  {
    level: "TC SC",
    books: [
      { subject: "Français", title: "Français Méthode et Pratiques 1ère/2ème TC" },
      { subject: "Français", title: "Aux champs (Guy de Maupassant)" },
      { subject: "Français", title: "Le chevalier double (Théophile Gautier)" },
      { subject: "Français", title: "Le bourgeois gentilhomme (Moliére)" },
      { subject: "Arabe", title: "منار اللغة العربية" },
      { subject: "Maths", title: "Maxi Maths le manuel TC - Nouvelle Edition" },
      { subject: "Physique-Chimie", title: "في رحاب + Work TC" },
      { subject: "Education islamique", title: "التربية الإسلامية" },
      { subject: "Anglais", title: "Solutions (Student's book + Work book): Pre-intermediate TC" },
      { subject: "S.V.T", title: "L'Archipel des S.V.T Edition Moynier TC" },
      { subject: "H.G", title: "المسار التاريخ الجغرافيا" },
      { subject: "Philosophie", title: "في رحاب مادة الفلسفة" },
    ],
  },
  {
    level: "1BAC SC EXP",
    books: [
      { subject: "Français", title: "La boite à merveilles" },
      { subject: "Français", title: "Le dernier jour d'un condamné" },
      { subject: "Français", title: "Antigone" },
      { subject: "Arabe", title: "الرائد في اللغة العربية" },
      { subject: "Maths", title: "المفيد في الرياضيات 1BAC" },
      { subject: "Physique-Chimie", title: "Etincelle physique chimie 1BAC" },
      { subject: "Education islamique", title: "رحاب التربية الإسلامية" },
      { subject: "Anglais", title: "Solutions: intermediate (Student's book + Work book) 1BAC" },
      { subject: "S.V.T", title: "Archipel 1BAC" },
      { subject: "H.G", title: "كتاب منار التاريخ و الجغرافيا" },
      { subject: "Philosophie", title: "في رحاب الفلسفة جميع الشعب العلمية و التقنية" },
    ],
  },
  {
    level: "1BAC SC MATHS",
    books: [
      { subject: "Français", title: "La boite à merveilles" },
      { subject: "Français", title: "Le dernier jour d'un condamné" },
      { subject: "Français", title: "Antigone" },
      { subject: "Arabe", title: "الرائد في اللغة العربية" },
      { subject: "Maths", title: "Al moufid en maths 1SM (tome1+tome2)" },
      { subject: "Education islamique", title: "رحاب التربية الإسلامية" },
      { subject: "Anglais", title: "Solutions: intermediate (Student's book + Work book) 1BAC" },
      { subject: "S.V.T", title: "Archipel 1BAC" },
      { subject: "H.G", title: "كتاب منار التاريخ و الجغرافيا" },
      { subject: "Philosophie", title: "في رحاب الفلسفة جميع الشعب العلمية و التقنية" },
    ],
  },
];

const LEVEL_ORDER = [
  "CP", "CE1", "CE2", "CM1", "CM2", "CE6",
  "1AC", "2AC", "3AC",
  "TC SC", "1BAC SC EXP", "1BAC SC MATHS",
];

async function main() {
  console.log("1. إنشاء مدرسة الأندلسية...");
  const school = await prisma.school.upsert({
    where: { name: "الأندلسية" },
    update: {},
    create: { name: "الأندلسية", region: "الخميسات" },
  });
  console.log(`   تم الإنشاء: ${school.name} (id: ${school.id})`);

  console.log("2. إنشاء الكتب حسب المستوى...");
  let total = 0;
  let skipped = 0;
  const sorted = levels.sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  for (const { level, books } of sorted) {
    for (const book of books) {
      const existing = await prisma.book.findFirst({
        where: { title: book.title, subject: book.subject, level, schoolId: school.id },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.book.create({
        data: { title: book.title, subject: book.subject, level, schoolId: school.id },
      });
      total++;
    }
    console.log(`   ${level}: ${books.length} كتاب`);
  }

  console.log(`\nتم بنجاح! ${total} كتاب جديد، ${skipped} متخطى (موجود مسبقاً) لمدرسة ${school.name}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
