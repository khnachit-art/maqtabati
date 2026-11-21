import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

function normalizeTitle(t: string): string {
  return t
    .trim()
    .replace(/\s+/g, " ");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const showAll = searchParams.get("showAll") === "true";
    const cmdNumber = searchParams.get("cmdNumber");

    const orderWhere: Record<string, unknown> = {};
    if (!showAll) orderWhere.status = "pending";
    if (cmdNumber) orderWhere.cmdNumber = cmdNumber;

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
      },
      include: {
        book: true,
        order: {
          include: { school: true },
        },
      },
    });

    const aggregated: Record<string, {
      bookId: number;
      title: string;
      subject: string;
      level: string;
      totalQuantity: number;
      schools: Set<string>;
      customerNames: Set<string>;
    }> = {};

    for (const item of orderItems) {
      if (level && item.book.level !== level) continue;

      const normKey = normalizeTitle(item.book.title);
      const key = `${item.book.level}|${normKey}`;
      if (!aggregated[key]) {
        aggregated[key] = {
          bookId: item.book.id,
          title: item.book.title,
          subject: item.book.subject,
          level: item.book.level,
          totalQuantity: 0,
          schools: new Set(),
          customerNames: new Set(),
        };
      }
      aggregated[key].totalQuantity += item.quantity;
      aggregated[key].schools.add(item.order.school.name);
      if (item.order.customerName) {
        aggregated[key].customerNames.add(item.order.customerName);
      }
    }

    const result = Object.values(aggregated)
      .filter((a) => a.totalQuantity > 0)
      .map((a) => ({
        ...a,
        schools: [...a.schools],
        customerNames: [...a.customerNames],
      }))
      .sort((a, b) => {
        const levelA = LEVEL_ORDER.indexOf(a.level);
        const levelB = LEVEL_ORDER.indexOf(b.level);
        if (levelA !== levelB) return levelA - levelB;
        if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
        return a.title.localeCompare(b.title);
      });

    logger.info(`Aggregated ${result.length} book entries (status: ${showAll ? "all" : "pending"})`);
    return NextResponse.json(result);
  } catch (error) {
    logger.error(`GET /api/summary failed: ${error}`);
    return NextResponse.json({ error: "Failed to aggregate" }, { status: 500 });
  }
}

const LEVEL_ORDER = [
  "PS","MS","GS",
  "CP","CE1","CE2","CM1","CM2","CE6",
  "1AC","2AC","3AC",
  "TC SC","1BAC SC EXP","1BAC SC MATHS","1BAC SC PC","1BAC SEG ECO",
  "2BAC SC EXP","2BAC SC MATHS","2BAC SC PC","2BAC SEG ECO",
];

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "markAllSent") {
      const { cmdNumber } = body;
      const result = await prisma.order.updateMany({
        where: { status: "pending" },
        data: {
          status: "sent",
          ...(cmdNumber ? { cmdNumber } : {}),
        },
      });
      logger.info(`Marked all pending orders as sent: ${result.count} orders, cmdNumber: ${cmdNumber || "none"}`);
      return NextResponse.json({ success: true, updated: result.count });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error(`PATCH /api/summary failed: ${error}`);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { bookId, newQuantity } = body;

    if (!bookId || typeof newQuantity !== "number" || newQuantity < 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const items = await prisma.orderItem.findMany({
      where: {
        bookId,
        order: { status: "pending" },
      },
      include: { order: true },
      orderBy: { id: "asc" },
    });

    if (items.length === 0 && newQuantity > 0) {
      const pendingOrder = await prisma.order.findFirst({
        where: { status: "pending" },
        orderBy: { id: "desc" },
      });
      if (!pendingOrder) {
        return NextResponse.json({ error: "No pending order found" }, { status: 400 });
      }
      await prisma.orderItem.create({
        data: { orderId: pendingOrder.id, bookId, quantity: newQuantity },
      });
      return NextResponse.json({ success: true, newQuantity });
    }

    const currentTotal = items.reduce((sum, i) => sum + i.quantity, 0);
    const diff = newQuantity - currentTotal;

    if (diff === 0) {
      return NextResponse.json({ success: true, newQuantity });
    }

    if (diff > 0) {
      if (items.length > 0) {
        await prisma.orderItem.update({
          where: { id: items[0].id },
          data: { quantity: items[0].quantity + diff },
        });
      }
    } else {
      let remaining = -diff;
      for (let i = items.length - 1; i >= 0 && remaining > 0; i--) {
        const remove = Math.min(items[i].quantity, remaining);
        const newQty = items[i].quantity - remove;
        if (newQty <= 0) {
          await prisma.orderItem.delete({ where: { id: items[i].id } });
        } else {
          await prisma.orderItem.update({
            where: { id: items[i].id },
            data: { quantity: newQty },
          });
        }
        remaining -= remove;
      }
    }

    return NextResponse.json({ success: true, newQuantity });
  } catch (error) {
    logger.error(`PUT /api/summary failed: ${error}`);
    return NextResponse.json({ error: "Failed to update quantity" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
    }

    const items = await prisma.orderItem.findMany({
      where: {
        bookId: parseInt(bookId),
        order: { status: "pending" },
      },
      include: { order: true },
      orderBy: { id: "asc" },
    });

    for (const item of items) {
      await prisma.orderItem.delete({ where: { id: item.id } });
    }

    return NextResponse.json({ success: true, deleted: items.length });
  } catch (error) {
    logger.error(`DELETE /api/summary failed: ${error}`);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
