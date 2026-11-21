import fs from "fs";
import path from "path";
import * as pdfjsLib from "pdfjs-dist";

async function extractPdfText(filePath: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    pages.push(strings.join(" "));
  }
  return pages.join("\n--- PAGE BREAK ---\n");
}

async function main() {
  const dir = process.argv[2];
  if (!dir) { console.error("Usage: tsx extract-pdf.ts <directory>"); process.exit(1); }

  const schools = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory());
  const allResults: Record<string, Record<string, string>> = {};

  for (const school of schools) {
    const schoolDir = path.join(dir, school.name);
    const files = fs.readdirSync(schoolDir).filter(f => f.toLowerCase().endsWith(".pdf"));
    allResults[school.name] = {};

    for (const file of files) {
      const fp = path.join(schoolDir, file);
      try {
        const text = await extractPdfText(fp);
        allResults[school.name][file] = text;
        console.log(`OK: ${school.name}/${file} (${text.length} chars)`);
      } catch (e: any) {
        console.log(`FAIL: ${school.name}/${file}: ${e.message}`);
      }
    }
  }

  fs.writeFileSync("scripts/extracted-data.json", JSON.stringify(allResults, null, 2), "utf-8");
  console.log("\nDone. Saved to scripts/extracted-data.json");
}

main().catch(console.error);
