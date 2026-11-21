import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const subject = searchParams.get("subject");
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (level) where.level = level;
    if (subject) where.subject = subject;
    if (schoolId) where.schoolId = Number(schoolId);
    if (search) where.title = { contains: search };

    const books = await prisma.book.findMany({
      where,
      orderBy: [{ level: "asc" }, { subject: "asc" }, { title: "asc" }],
    });

    logger.info(`Fetched ${books.length} books`);
    return NextResponse.json(books);
  } catch (error) {
    logger.error(`GET /api/catalog failed: ${error}`);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, subject, level, schoolId } = body;

    if (!title || !subject || !level) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: { title, subject, level, schoolId: schoolId || null },
    });

    logger.info(`Created book: ${book.title} (${book.level})`);
    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    logger.error(`POST /api/catalog failed: ${error}`);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, subject, level, schoolId } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing book id" }, { status: 400 });
    }

    const book = await prisma.book.update({
      where: { id },
      data: { title, subject, level, schoolId: schoolId || null },
    });

    logger.info(`Updated book: ${book.title} (${book.level})`);
    return NextResponse.json(book);
  } catch (error) {
    logger.error(`PUT /api/catalog failed: ${error}`);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing book id" }, { status: 400 });
    }

    await prisma.book.delete({ where: { id: Number(id) } });

    logger.info(`Deleted book id: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(`DELETE /api/catalog failed: ${error}`);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
