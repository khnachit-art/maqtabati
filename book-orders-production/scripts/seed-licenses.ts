import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { generateLicenseKey } from "../src/lib/license";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding license keys...");

  // Create demo license keys for testing
  const demoLicenses = [
    {
      customerName: "مدرسة الأندلسية الابتدائية",
      customerEmail: "andaloussia@example.com",
      customerPhone: "05XXXXXXXX",
      companyName: "مجموعة مدارس الأندلسية",
      expiresAt: new Date("2027-12-31"),
      maxUsers: 5,
      maxSchools: 10,
      maxBooks: 5000,
      notes: "مفتاح تجريبي للمدرسة الأندلسية",
      createdBy: 1,
    },
    {
      customerName: "مدرسة الآفاق الإعدادية",
      customerEmail: "alafak@example.com",
      customerPhone: "06XXXXXXXX",
      companyName: "مجموعة مدارس الآفاق",
      expiresAt: new Date("2026-06-30"),
      maxUsers: 3,
      maxSchools: 5,
      maxBooks: 2000,
      notes: "مفتاح تجريبي للمدرسة الآفاق - ينتهي قريباً",
      createdBy: 1,
    },
    {
      customerName: "مكتبة نور الهدى",
      customerEmail: "nour@example.com",
      customerPhone: "07XXXXXXXX",
      companyName: "مؤسسة نور الهدى للتعليم",
      expiresAt: null, // No expiration
      maxUsers: 10,
      maxSchools: 50,
      maxBooks: 10000,
      notes: "مفتاح غير محدود المدة",
      createdBy: 1,
    },
    {
      customerName: "عميل تجريبي منتهي",
      customerEmail: "expired@example.com",
      customerPhone: "05XXXXXXXX",
      companyName: "شركة منتهية الصلاحية",
      expiresAt: new Date("2024-01-01"),
      maxUsers: 1,
      maxSchools: 1,
      maxBooks: 100,
      notes: "مفتاح منتهي الصلاحية للاختبار",
      createdBy: 1,
    },
  ];

  for (const licenseData of demoLicenses) {
    // Generate unique key
    let key: string;
    let attempts = 0;
    do {
      key = generateLicenseKey();
      const existing = await prisma.licenseKey.findUnique({ where: { key } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      console.log(`Failed to generate unique key for ${licenseData.customerName}`);
      continue;
    }

    const license = await prisma.licenseKey.upsert({
      where: { key },
      update: {},
      create: {
        key,
        ...licenseData,
        status: licenseData.expiresAt && new Date(licenseData.expiresAt) < new Date() ? "expired" : "active",
      },
    });

    console.log(`Created license: ${license.customerName} - ${key}`);
  }

  // Also create admin user if not exists
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: "$2a$10$8K1p/a0dURXAm7QiTRqUauO9.9YdpM4DqO1zHqYYJjVlFzYaYqE0i", // admin123
      name: "Administrateur",
      role: "admin",
    },
  });

  console.log("Admin user:", admin.username);
  console.log("License seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });