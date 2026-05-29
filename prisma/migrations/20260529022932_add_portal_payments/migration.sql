-- AlterTable
ALTER TABLE "PortalInvoice" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedById" TEXT,
ADD COLUMN     "paymentId" TEXT;

-- CreateTable
CREATE TABLE "PortalPayment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" INTEGER NOT NULL,
    "initialPayment" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalPaymentProject" (
    "paymentId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "PortalPaymentProject_pkey" PRIMARY KEY ("paymentId","projectId")
);

-- CreateIndex
CREATE INDEX "PortalPayment_clientId_idx" ON "PortalPayment"("clientId");

-- CreateIndex
CREATE INDEX "PortalPayment_status_idx" ON "PortalPayment"("status");

-- CreateIndex
CREATE INDEX "PortalPayment_createdAt_idx" ON "PortalPayment"("createdAt");

-- CreateIndex
CREATE INDEX "PortalPaymentProject_paymentId_idx" ON "PortalPaymentProject"("paymentId");

-- CreateIndex
CREATE INDEX "PortalPaymentProject_projectId_idx" ON "PortalPaymentProject"("projectId");

-- CreateIndex
CREATE INDEX "PortalInvoice_paymentId_idx" ON "PortalInvoice"("paymentId");

-- AddForeignKey
ALTER TABLE "PortalInvoice" ADD CONSTRAINT "PortalInvoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PortalPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalPayment" ADD CONSTRAINT "PortalPayment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalPayment" ADD CONSTRAINT "PortalPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalPaymentProject" ADD CONSTRAINT "PortalPaymentProject_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PortalPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalPaymentProject" ADD CONSTRAINT "PortalPaymentProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
