import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = "admin123";
  const name = "Administrateur";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`User '${username}' already exists. Updating password...`);
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { username }, data: { password: hashed } });
    console.log("Password updated.");
  } else {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, password: hashed, name, role: "admin" },
    });
    console.log(`Created user: ${username}`);
  }

  console.log(`\nLogin credentials:`);
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
