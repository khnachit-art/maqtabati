const fs = require("fs");
const path = require("path");
const PDFParser = require("pdf2json");

function extractPdfText(filePath) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on("pdfParser_dataError", (err) => reject(err.parserError));
    parser.on("pdfParser_dataReady", (pdfData) => {
      const pages = pdfData.Pages || [];
      const texts = pages.map((page) => {
        const texts = page.Texts || [];
        return texts
          .map((t) => {
            return (t.R || []).map((r) => decodeURIComponent(r.T)).join("");
          })
          .join(" ");
      });
      resolve(texts.join("\n--- PAGE BREAK ---\n"));
    });
    parser.loadPDF(filePath);
  });
}

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: node extract-pdf.cjs <directory>");
    process.exit(1);
  }

  const schools = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory());
  const allResults = {};

  for (const school of schools) {
    const schoolDir = path.join(dir, school.name);
    const files = fs.readdirSync(schoolDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
    allResults[school.name] = {};

    for (const file of files) {
      const fp = path.join(schoolDir, file);
      try {
        const text = await extractPdfText(fp);
        allResults[school.name][file] = text;
        console.log(`OK: ${school.name}/${file} (${text.length} chars)`);
      } catch (e) {
        console.log(`FAIL: ${school.name}/${file}: ${e.message || e}`);
      }
    }
  }

  fs.writeFileSync(
    "scripts/extracted-data.json",
    JSON.stringify(allResults, null, 2),
    "utf-8"
  );
  console.log("\nDone. Saved to scripts/extracted-data.json");
}

main().catch(console.error);
