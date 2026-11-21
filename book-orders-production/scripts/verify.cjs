const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const schools = await p.school.findMany();
  console.log("Schools:", schools.length);
  schools.forEach((s) => console.log("  -", s.name, "(" + s.region + ")"));

  const books = await p.book.findMany();
  console.log("\nBooks:", books.length);

  const byLevel = {};
  books.forEach((b) => { byLevel[b.level] = (byLevel[b.level] || 0) + 1; });
  console.log("By level:");
  Object.entries(byLevel).sort().forEach(([k, v]) => console.log("  " + k + ": " + v));

  const bySubject = {};
  books.forEach((b) => { bySubject[b.subject] = (bySubject[b.subject] || 0) + 1; });
  console.log("By subject:");
  Object.entries(bySubject).sort().forEach(([k, v]) => console.log("  " + k + ": " + v));

  await p.$disconnect();
})();
