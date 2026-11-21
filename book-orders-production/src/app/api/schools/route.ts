import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      orderBy: [{ region: "asc" }, { name: "asc" }],
    });
    logger.info(`Fetched ${schools.length} schools`);
    return NextResponse.json(schools);
  } catch (error) {
    logger.error(`GET /api/schools failed: ${error}`);
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, region } = body;

    if (!name || !region) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const school = await prisma.school.create({
      data: { name, region },
    });

    logger.info(`Created school: ${school.name}`);
    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    logger.error(`POST /api/schools failed: ${error}`);
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing school id" }, { status: 400 });
    }

    await prisma.school.delete({ where: { id: Number(id) } });

    logger.info(`Deleted school id: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(`DELETE /api/schools failed: ${error}`);
    return NextResponse.json({ error: "Failed to delete school" }, { status: 500 });
  }
}
