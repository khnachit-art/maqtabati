import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeKey } from "@/lib/license";

// POST - Validate license key (customer login)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, ipAddress, userAgent } = body;

    if (!key) {
      return NextResponse.json({ error: "License key is required" }, { status: 400 });
    }

    const normalizedKey = normalizeKey(key);
    const license = await prisma.licenseKey.findUnique({
      where: { key: normalizedKey },
    });

    if (!license) {
      return NextResponse.json(
        { valid: false, error: "مفتاح غير صحيح" },
        { status: 401 }
      );
    }

    // Check status
    if (license.status !== "active") {
      const statusMessages: Record<string, string> = {
        expired: "انتهت صلاحية المفتاح",
        revoked: "تم إلغاء المفتاح",
        suspended: "المفتاح معلق مؤقتاً",
      };
      return NextResponse.json(
        { valid: false, error: statusMessages[license.status] || "مفتاح غير صالح" },
        { status: 403 }
      );
    }

    // Check expiration
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      // Auto-update status to expired
      await prisma.licenseKey.update({
        where: { id: license.id },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { valid: false, error: "انتهت صلاحية المفتاح" },
        { status: 403 }
      );
    }

    // Log usage
    await prisma.licenseUsage.create({
      data: {
        licenseKeyId: license.id,
        ipAddress,
        userAgent,
        action: "login",
      },
    });

    // Update last used
    await prisma.licenseKey.update({
      where: { id: license.id },
      data: { lastUsedAt: new Date() },
    });

    return NextResponse.json({
      valid: true,
      license: {
        id: license.id,
        customerName: license.customerName,
        customerEmail: license.customerEmail,
        companyName: license.companyName,
        maxUsers: license.maxUsers,
        maxSchools: license.maxSchools,
        maxBooks: license.maxBooks,
        expiresAt: license.expiresAt,
      },
    });
  } catch (error) {
    console.error("POST /api/license/validate error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}