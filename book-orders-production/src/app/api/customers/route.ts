import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    let customers;

    if (search) {
      customers = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
          ],
        },
        include: {
          orders: {
            include: {
              items: { include: { book: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      });
    } else {
      customers = await prisma.customer.findMany({
        include: {
          orders: {
            include: {
              items: { include: { book: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      });
    }

    const customersWithStats = customers.map((customer) => {
      const totalOrders = customer.orders.length;
      const totalItems = customer.orders.reduce(
        (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      );
      const lastOrder = customer.orders.length > 0 ? customer.orders[0].createdAt : null;

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        totalOrders,
        totalItems,
        lastOrder,
      };
    });

    logger.info(`Fetched ${customersWithStats.length} customers`);
    return NextResponse.json(customersWithStats);
  } catch (error) {
    logger.error(`GET /api/customers failed: ${error}`);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, address } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const customer = await prisma.customer.upsert({
      where: {
        name_phone: {
          name: name.trim(),
          phone: phone || "",
        },
      },
      update: {
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
      },
      create: {
        name: name.trim(),
        phone: phone || "",
        email: email || "",
        address: address || "",
      },
    });

    logger.info(`Created/updated customer: ${customer.name}`);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    logger.error(`POST /api/customers failed: ${error}`);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing customer id" }, { status: 400 });
    }

    await prisma.customer.delete({ where: { id: Number(id) } });

    logger.info(`Deleted customer id: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(`DELETE /api/customers failed: ${error}`);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
