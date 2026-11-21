import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateLicenseKey, validateKeyFormat } from "@/lib/license";

// GET - List all license keys (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { key: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { companyName: { contains: search } },
      ];
    }

    const [licenses, total] = await Promise.all([
      prisma.licenseKey.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: { select: { name: true } },
          _count: { select: { usages: true } },
        },
      }),
      prisma.licenseKey.count({ where }),
    ]);

    return NextResponse.json({
      licenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/license error:", error);
    return NextResponse.json({ error: "Failed to fetch licenses" }, { status: 500 });
  }
}

// POST - Create new license key (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      expiresAt,
      maxUsers = 1,
      maxSchools = 10,
      maxBooks = 1000,
      notes,
      createdBy,
    } = body;

    if (!customerName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

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
      return NextResponse.json({ error: "Failed to generate unique key" }, { status: 500 });
    }

    const license = await prisma.licenseKey.create({
      data: {
        key,
        customerName,
        customerEmail,
        customerPhone,
        companyName,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUsers,
        maxSchools,
        maxBooks,
        notes,
        createdBy,
      },
    });

    return NextResponse.json(license, { status: 201 });
  } catch (error) {
    console.error("POST /api/license error:", error);
    return NextResponse.json({ error: "Failed to create license" }, { status: 500 });
  }
}