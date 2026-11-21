const fs = require("fs");
const path = require("path");

const extractedPath = path.join(__dirname, "extracted-data.json");
const data = JSON.parse(fs.readFileSync(extractedPath, "utf-8"));

// Level mapping from filenames to normalized levels
const levelMap = {
  // رياض المعرفة
  "CP 2026-2027.pdf": "CP",
  "CE1-  2026-2027.pdf": "CE1",
  "CE2-  2026-2027.pdf": "CE2",
  "CE6-  2026-2027.pdf": "CE6",
  "CM1-  2026-2027.pdf": "CM1",
  "CM2-  2026-2027.pdf": "CM2",
  "7 m - 2026-2027.pdf": "7ème",
  "8 m - 2026-2027.pdf": "8ème",
  "9 m - 2026-2027.pdf": "9ème",
  "TRC - 2026-2027.pdf": "TRC",
  "1 BAC - 2026-2027.pdf": "1BAC",
  "2 BAC - 2026-2027.pdf": "2BAC",
  "GS 2026-2027.pdf": "GS",
  "MS 2026-2027.pdf": "MS",

  // واحة السلام
  "cp.pdf": "CP",
  "ce1.pdf": "CE1",
  "ce2.pdf": "CE2",
  "ce6.pdf": "CE6",
  "cm1.pdf": "CM1",
  "cm2.pdf": "CM2",

  // الافاق
  "1APG Fournitures scolaires 2026-2027.pdf": "1APG",
  "1APIC Fournitures scolaires 2026-2027.pdf": "1APIC",
  "2APG Fournitures scolaires 2026-2027.pdf": "2APG",
  "2APIC Fournitures scolaires 2026-2027.pdf": "2APIC",
  "3APG Fournitures scolaires 2026-2027.pdf": "3APG",
  "3APIC Fournitures scolaires 2026-2027.pdf": "3APIC",
  "4APG Fournitures scolaires 2026-2027.pdf": "4APG",
  "5APG Fournitures scolaires 2026-2027.pdf": "5APG",
  "6APG Fournitures scolaires 2026-2027.pdf": "6APG",
  "Fournitures scolaires 1re Bac Sc. Eco.pdf": "1BAC-SE",
  "Fournitures scolaires 1re Bac Sc. Ex.pdf": "1BAC-SX",
  "Fournitures scolaires 1re Bac Sc. Maths.pdf": "1BAC-SM",
  "Fournitures scolaires 2me  Bac Sc.PC.pdf": "2BAC-PC",
  "Fournitures scolaires 2me Bac Sc. Eco.pdf": "2BAC-SE",
  "Fournitures scolaires 2me Bac Sc. Maths.pdf": "2BAC-SM",
  "fournitures scolaires TCS.pdf": "TCS",

  // نور الهدى
  "fourniture college  2026- 2027.pdf": "COLLEGE",
  "Fourniture PRIMAIRE  2026-2027.pdf": "PRIMAIRE",
  "Fourniture PS-MS-GS  2026 - 2027.pdf": "PS-MS-GS",
  "الأولى باكالوريا ع - ت 2026- 2027.pdf": "1BAC-AT",
  "الأولى باكالوريا ع - ر 2026- 2027.pdf": "1BAC-AR",
  "الثانية باكالوريا ع - ر 2026- 2027.pdf": "2BAC-AR",
  "الثانية باكالوريا ع - ف 2026- 2027.pdf": "2BAC-AF",
  "جدع مشترك 2026- 2027.pdf": "TCS",
};

// Subject detection patterns
const subjectPatterns = [
  { pattern: /fran[cç]ais/i, subject: "فرنسية" },
  { pattern: /anglais/i, subject: "إنجليزية" },
  { pattern: /math[ée]matiques?|maths/i, subject: "رياضيات" },
  { pattern: /sciences?\s*(?:de la vie|nature|la vie et la terre|svt)/i, subject: "علوم طبيعية" },
  { pattern: /physique\s*chimie/i, subject: "فيزياء كيمياء" },
  { pattern: /informatique/i, subject: "إعلام آلي" },
  { pattern: /arabe|عربية|العربية/i, subject: "عربية" },
  { pattern: /histoire|جغرافيا/i, subject: "تاريخ جغرافيا" },
  { pattern: /philosophie|فلسفة/i, subject: "فلسفة" },
  { pattern: /technique|تقني/i, subject: "تقني رياضي" },
  { pattern: /islamique|إسلامية|ال التربية الإسلامية/i, subject: "تربية إسلامية" },
  { pattern: /amazigh|أمازيغية/i, subject: "أمازيغية" },
  { pattern: /musique|موسيقى/i, subject: "موسيقى" },
  { pattern: /arts?\s*plastiques?|ترسم/i, subject: "ترسم" },
];

function detectSubject(text) {
  for (const { pattern, subject } of subjectPatterns) {
    if (pattern.test(text)) return subject;
  }
  return "عام";
}

// Extract books from text
function extractBooks(text, level) {
  const books = [];
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);

  // Known book publishers/series patterns
  const bookPatterns = [
    // French book titles - common patterns
    /(?:Taoki|Super Minds|TOP|On Screen|ETINCELLE|Evoluer|Maxi|Méthodes|Résoudre|Bien Dire|Archipel|I Won|Le trésor|Cahiers de la Luciole|Mon cahier|Robotique|Génie|Istra|Hatier|RABIH|CDPL|CDP\.L|Sochepress|MSM)/i,
    // Arabic book patterns
  ];

  let currentSubject = "عام";

  for (const line of lines) {
    // Detect subject headers
    const sub = detectSubject(line);
    if (sub !== "عام") {
      currentSubject = sub;
    }

    // Extract book titles - look for italic/bold text markers and known patterns
    const bookMatches = line.match(
      /(?:Taoki\s+et\s+compagnie|Super\s+Minds|TOP\s+(?:Math|Sciences)|On\s+Screen|ETINCELLE|Evoluer\s+en|Maxi[\s-]+Maths|Aux\s+champs|Le\s+chevalier|Le\s+bourgeois|ON\s+SCREEN|Archipel|I\s+WONDER|Le\s+trésor\s+des|MOTS|Mon\s+cahier\s+d['']investigation|Robotique\s+et|intelligence\s+artificielle|Génie\s+des|Cahiers?\s+de\s+la\s+Luciole|La\s+Musique|La\s+petite|bibliobus|Et\s+si\s+on|Fichiers?\s+de|FICHIER|Mathématiques?\s+\d|Découverte\s+\d|Activités?\s+\d|Leçons?\s+\d|Éveil\s+au|Connaissance|Lecture\s+\d|Lecture[\s-]+écriture|Arabe\s+\d|Etude\s+du|Islamique|Amazigh|Français\s+\d|Résoudre[\s-]+je\s+résous|Bien\s+dire|Leçons?\s+de\s+vie|Cahier\s+d[''](?:activité|exercice|lecture|écriture|poésie)|L['']album|Les\s+100\s+recettes|Et\s+si\s+on\s+jeu|Réussir\s+en|Savoir[\s-]+lire|Ma\s+première|Carnet|Découverte|Découvrir|Récréations?|Nouveau\s+Franc|Les\s+Amis|L['']atelier|Réussite|Réussir|Clefs|Clés|Traces|Repères|Cahier\s+de\s+vie|Cahier\s+de\s+progrès|Clair|Déclic|L['']écho|Trampolino|Les\s+atouts|Atout\s+Plus|Projet|Découvertes|Aventures|Parcours|Ensemble|Nouveau\s+monde|Orient|Vision|Espace|Repères|Savoir[\s-]+faire|Savoir[\s-]+lire|Savoir[\s-]+dire|Lecture[\s-]+expression|Je\s+lis|Je\s+lis\s+et\s+je\s+comprends|Je\s+lis\s+et\s+je\s+compte|Mon\s+cahier\s+de\s+(?:lecture|maths|français|sciences|vocabulaire|grammaire|orthographe|conjugaison|production\s+écrite)|Je\s+ lis\s+et\s+je\s+comprends|Bien\s+lire|Fluence|Récréation|T(?:OP|RI)\s+M(?:aths|ath|ath[ée]matiques)|(?:Atouts|Atout)\s+Plus|Mon\s+guide|Mon\s+manuel|Le\s+Guide|Le\s+Manuel|Le\s+cahier|Les\s+cahiers|Le\s+livre|Les\s+livres|Le\s+petit|Les\s+petits|Le\s+grand|Les\s+grands)/gi
    );

    if (bookMatches) {
      for (const match of bookMatches) {
        const clean = match.replace(/\s+/g, " ").trim();
        if (clean.length > 3) {
          books.push({ title: clean, subject: currentSubject });
        }
      }
    }

    // Also try to find book-like entries (title + edition pattern)
    const editionMatch = line.match(/(?:Edition|Édition|ed\.|ed)\s*[:\.]?\s*\w+/gi);
    if (editionMatch) {
      // The text before "Edition" is likely a book title
      for (const em of editionMatch) {
        const idx = line.indexOf(em);
        if (idx > 5) {
          const titlePart = line.substring(Math.max(0, idx - 80), idx).trim();
          const cleaned = titlePart.replace(/[–\-]\s*$/, "").replace(/^\s*[-–]\s*/, "").trim();
          if (cleaned.length > 5 && !cleaned.match(/^\d/)) {
            books.push({ title: cleaned, subject: currentSubject });
          }
        }
      }
    }
  }

  return books;
}

// Main processing
const allBooks = new Map(); // key: "level|subject|title"
const schoolCounts = {};

for (const [schoolName, files] of Object.entries(data)) {
  if (Object.keys(files).length === 0) continue;

  schoolCounts[schoolName] = { total: 0, files: 0 };

  for (const [filename, text] of Object.entries(files)) {
    const level = levelMap[filename];
    if (!level) {
      console.log(`SKIP (no level mapping): ${schoolName}/${filename}`);
      continue;
    }

    const books = extractBooks(text, level);
    schoolCounts[schoolName].files++;

    for (const book of books) {
      const key = `${level}|${book.subject}|${book.title}`;
      if (!allBooks.has(key)) {
        allBooks.set(key, {
          level,
          subject: book.subject,
          title: book.title,
          schools: new Set(),
        });
      }
      allBooks.get(key).schools.add(schoolName);
      schoolCounts[schoolName].total++;
    }
  }
}

// Output summary
console.log("\n=== EXTRACTION SUMMARY ===\n");
console.log(`Total unique books: ${allBooks.size}`);
console.log(`Schools processed: ${Object.keys(schoolCounts).length}`);
for (const [school, count] of Object.entries(schoolCounts)) {
  console.log(`  ${school}: ${count.files} files, ${count.total} book entries`);
}

// Group by level
const byLevel = {};
for (const book of allBooks.values()) {
  if (!byLevel[book.level]) byLevel[book.level] = [];
  byLevel[book.level].push(book);
}

console.log("\n=== BOOKS BY LEVEL ===\n");
for (const [level, books] of Object.entries(byLevel).sort()) {
  console.log(`${level}: ${books.length} books`);
  for (const b of books.slice(0, 3)) {
    console.log(`  - [${b.subject}] ${b.title.substring(0, 60)}`);
  }
  if (books.length > 3) console.log(`  ... and ${books.length - 3} more`);
}

// Save for seed script
const seedData = [];
const seen = new Set();
for (const book of allBooks.values()) {
  const key = `${book.title}|${book.subject}|${book.level}`;
  if (!seen.has(key)) {
    seen.add(key);
    seedData.push({
      title: book.title,
      subject: book.subject,
      level: book.level,
    });
  }
}

fs.writeFileSync(
  path.join(__dirname, "seed-data.json"),
  JSON.stringify(seedData, null, 2),
  "utf-8"
);
console.log(`\nSeed data saved: ${seedData.length} unique books to scripts/seed-data.json`);
