import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        school: true,
        items: { include: { book: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    logger.info(`Fetched ${orders.length} orders`);
    return NextResponse.json(orders);
  } catch (error) {
    logger.error(`GET /api/orders failed: ${error}`);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schoolId, items, customerName, phone, notes, customerId, orderDate } = body;

    if (!schoolId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let finalCustomerId = customerId;

    if (!finalCustomerId && customerName) {
      const customer = await prisma.customer.upsert({
        where: {
          name_phone: {
            name: customerName.trim(),
            phone: phone || "",
          },
        },
        update: {
          phone: phone || undefined,
        },
        create: {
          name: customerName.trim(),
          phone: phone || "",
        },
      });
      finalCustomerId = customer.id;
    }

    const order = await prisma.order.create({
      data: {
        schoolId,
        customerId: finalCustomerId || null,
        customerName: customerName || "",
        phone: phone || "",
        notes: notes || "",
        createdAt: orderDate ? new Date(orderDate) : undefined,
        items: {
          create: items.map((item: { bookId: number; quantity: number }) => ({
            bookId: item.bookId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        school: true,
        items: { include: { book: true } },
      },
    });

    logger.info(`Created order #${order.id} for school ${order.school.name}`);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    logger.error(`POST /api/orders failed: ${error}`);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, action, itemId, bookId, quantity } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (action === "updateItem" && itemId && quantity !== undefined) {
      if (quantity <= 0) {
        await prisma.orderItem.delete({ where: { id: itemId } });
      } else {
        await prisma.orderItem.update({ where: { id: itemId }, data: { quantity } });
      }
    } else if (action === "addItem" && bookId && quantity > 0) {
      const existing = await prisma.orderItem.findFirst({ where: { orderId, bookId } });
      if (existing) {
        await prisma.orderItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
      } else {
        await prisma.orderItem.create({ data: { orderId, bookId, quantity } });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      include: { school: true, items: { include: { book: true } } },
    });

    logger.info(`Updated order #${orderId} (${action})`);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error(`PATCH /api/orders failed: ${error}`);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    await prisma.order.delete({ where: { id: Number(id) } });

    logger.info(`Deleted order id: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(`DELETE /api/orders failed: ${error}`);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
