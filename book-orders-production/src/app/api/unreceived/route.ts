import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const unreceivedItems = await prisma.orderItem.findMany({
      where: {
        received: false,
        order: { status: "confirmed" },
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

    for (const item of unreceivedItems) {
      const key = `${item.book.level}|${item.book.title}`;
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
      }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/unreceived failed:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
