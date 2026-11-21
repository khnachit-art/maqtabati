-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "received" BOOLEAN;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "cmdNumber" TEXT;
