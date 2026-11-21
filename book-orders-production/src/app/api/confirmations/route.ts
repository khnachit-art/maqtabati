import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[،,\.\-\(\)\[\]\/\\:;!\?\"\'\+]/g, "")
    .replace(/\s+/g, " ")
    .replace(/طبعة\s*(جديدة|جديد|الجديدة|الجديد)?\s*\d*/g, "")
    .replace(/طبعة\s*\d*/g, "")
    .replace(/السنة\s+\S+\s+\S+/g, "")
    .replace(/\d+\s*اب/g, "")
    .replace(/\d+\s*سنة/g, "")
    .replace(/ اب$/g, "")
    .replace(/ اب /g, " ")
    .replace(/deuxi[eè]me\s*[ée]dition/g, "")
    .replace(/premi[èe]re\s*[ée]dition/g, "")
    .replace(/2ème\s*édition/g, "")
    .replace(/3ème\s*édition/g, "")
    .replace(/troisième\s*édition/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cmdNumber = searchParams.get("cmdNumber");

    const orderWhere: Record<string, unknown> = { status: "sent" };
    if (cmdNumber) orderWhere.cmdNumber = cmdNumber;

    const sentItems = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
      },
      include: {
        book: true,
        order: { include: { school: true } },
      },
      orderBy: { id: "asc" },
    });

    const aggregated: Record<string, {
      bookIds: number[];
      title: string;
      level: string;
      subject: string;
      totalOrdered: number;
      totalReceived: number;
      confirmed: boolean;
      cmdNumber: string;
      orderId: number;
      customers: {
        orderId: number;
        orderItemId: number;
        customerName: string;
        schoolName: string;
        quantity: number;
        received: boolean | null;
        orderDate: Date;
      }[];
    }> = {};

    for (const item of sentItems) {
      const normKey = `${item.book.level}|${normalizeTitle(item.book.title)}|${item.order.cmdNumber || "no-cmd"}|${item.orderId}`;
      if (!aggregated[normKey]) {
        aggregated[normKey] = {
          bookIds: [],
          title: item.book.title,
          level: item.book.level,
          subject: item.book.subject,
          totalOrdered: 0,
          totalReceived: 0,
          confirmed: true,
          cmdNumber: item.order.cmdNumber || "",
          orderId: item.orderId,
          customers: [],
        };
      }
      if (!aggregated[normKey].bookIds.includes(item.bookId)) {
        aggregated[normKey].bookIds.push(item.bookId);
      }
      aggregated[normKey].totalOrdered += item.quantity;
      if (item.received === true) aggregated[normKey].totalReceived += item.quantity;
      if (item.received === null) aggregated[normKey].confirmed = false;
      aggregated[normKey].customers.push({
        orderId: item.order.id,
        orderItemId: item.id,
        customerName: item.order.customerName || "—",
        schoolName: item.order.school.name,
        quantity: item.quantity,
        received: item.received,
        orderDate: item.order.createdAt,
      });
    }

    for (const key of Object.keys(aggregated)) {
      aggregated[key].customers.sort(
        (a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
      );
    }

    const levelOrder = ["PS","MS","GS","CP","CE1","CE2","CM1","CM2","CE6","1AC","2AC","3AC","TC SC","1BAC SC EXP","1BAC SC MATHS","1BAC SC PC","1BAC SEG ECO","2BAC SC EXP","2BAC SC MATHS","2BAC SC PC","2BAC SEG ECO"];
    const result = Object.values(aggregated).sort((a, b) => {
      const la = levelOrder.indexOf(a.level);
      const lb = levelOrder.indexOf(b.level);
      if (la !== lb) return la - lb;
      return a.title.localeCompare(b.title);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/confirmations failed:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const results: {
      bookIds: number[];
      bookTitle: string;
      totalOrdered: number;
      received: number;
      unreceived: number;
      addedToNextOrder: number;
    }[] = [];

    for (const entry of items) {
      const { bookIds, receivedQuantity } = entry;
      if (!bookIds || !Array.isArray(bookIds) || typeof receivedQuantity !== "number") continue;

      const allItems = await prisma.orderItem.findMany({
        where: {
          bookId: { in: bookIds },
          order: { status: "sent" },
        },
        include: { order: true, book: true },
        orderBy: { id: "asc" },
      });

      if (allItems.length === 0) continue;

      const bookTitle = allItems[0].book?.title ?? "Unknown";
      const totalOrdered = allItems.reduce((sum, i) => sum + i.quantity, 0);
      const actualReceived = Math.min(receivedQuantity, totalOrdered);
      let remaining = actualReceived;
      const fulfilledMap: Record<number, number> = {};

      for (const item of allItems) {
        if (remaining <= 0) break;
        const fulfill = Math.min(item.quantity, remaining);

        await prisma.orderItem.update({
          where: { id: item.id },
          data: { received: true, quantity: fulfill },
        });

        fulfilledMap[item.id] = fulfill;
        remaining -= fulfill;
      }

      let addedToNextOrder = 0;

      for (const item of allItems) {
        const fulfilled = fulfilledMap[item.id] || 0;
        const unreceivedQty = item.quantity - fulfilled;

        if (unreceivedQty <= 0) continue;

        let pendingOrder = await prisma.order.findFirst({
          where: { status: "pending", schoolId: item.order.schoolId },
          orderBy: { id: "desc" },
        });

        if (!pendingOrder) {
          pendingOrder = await prisma.order.create({
            data: {
              schoolId: item.order.schoolId,
              customerName: item.order.customerName || "",
              phone: item.order.phone || "",
              notes: "كتب غير متوصل بها - تلقائي",
              status: "pending",
            },
          });
        }

        const existingItem = await prisma.orderItem.findFirst({
          where: { orderId: pendingOrder.id, bookId: item.bookId },
        });

        if (existingItem) {
          await prisma.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + unreceivedQty },
          });
        } else {
          await prisma.orderItem.create({
            data: { orderId: pendingOrder.id, bookId: item.bookId, quantity: unreceivedQty },
          });
        }
        addedToNextOrder += unreceivedQty;

        if (fulfilled === 0) {
          await prisma.orderItem.update({
            where: { id: item.id },
            data: { received: false },
          });
        }
      }

      results.push({
        bookIds,
        bookTitle,
        totalOrdered,
        received: actualReceived,
        unreceived: totalOrdered - actualReceived,
        addedToNextOrder,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("POST /api/confirmations failed:", error);
    return NextResponse.json({ error: "Failed to confirm" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { bookIds } = body;

    if (!bookIds || !Array.isArray(bookIds)) {
      return NextResponse.json({ error: "Missing bookIds" }, { status: 400 });
    }

    const confirmedItems = await prisma.orderItem.findMany({
      where: {
        bookId: { in: bookIds },
        order: { status: "sent" },
        OR: [
          { received: true },
          { received: false },
        ],
      },
      include: { order: true, book: true },
    });

    const bookTitle = confirmedItems[0]?.book?.title || "";

    for (const item of confirmedItems) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { received: null, quantity: item.quantity },
      });
    }

    const pendingOrders = await prisma.order.findMany({
      where: { status: "pending", notes: "كتب غير متوصل بها - تلقائي" },
      include: { items: true },
    });

    for (const order of pendingOrders) {
      const relevantItems = order.items.filter(i => bookIds.includes(i.bookId));
      if (relevantItems.length > 0) {
        for (const ri of relevantItems) {
          await prisma.orderItem.delete({ where: { id: ri.id } });
        }
        const remainingItems = await prisma.orderItem.findMany({
          where: { orderId: order.id },
        });
        if (remainingItems.length === 0) {
          await prisma.order.delete({ where: { id: order.id } });
        }
      }
    }

    return NextResponse.json({ success: true, undone: confirmedItems.length, bookTitle });
  } catch (error) {
    console.error("DELETE /api/confirmations failed:", error);
    return NextResponse.json({ error: "Failed to undo" }, { status: 500 });
  }
}
