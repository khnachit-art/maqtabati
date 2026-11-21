import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single license key details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const license = await prisma.licenseKey.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true } },
        usages: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json(license);
  } catch (error) {
    console.error("GET /api/license/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch license" }, { status: 500 });
  }
}

// PUT - Update license key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      status,
      expiresAt,
      maxUsers,
      maxSchools,
      maxBooks,
      notes,
    } = body;

    const license = await prisma.licenseKey.update({
      where: { id },
      data: {
        customerName,
        customerEmail,
        customerPhone,
        companyName,
        status,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUsers,
        maxSchools,
        maxBooks,
        notes,
      },
    });

    return NextResponse.json(license);
  } catch (error) {
    console.error("PUT /api/license/[id] error:", error);
    return NextResponse.json({ error: "Failed to update license" }, { status: 500 });
  }
}

// DELETE - Revoke/Delete license key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    if (hardDelete) {
      await prisma.licenseKey.delete({ where: { id } });
    } else {
      await prisma.licenseKey.update({
        where: { id },
        data: { status: "revoked" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/license/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete license" }, { status: 500 });
  }
}