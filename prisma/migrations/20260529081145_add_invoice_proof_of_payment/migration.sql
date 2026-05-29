-- AlterTable
ALTER TABLE "PortalInvoice" ADD COLUMN     "proofOfPaymentName" TEXT,
ADD COLUMN     "proofOfPaymentUrl" TEXT,
ADD COLUMN     "proofRequired" BOOLEAN NOT NULL DEFAULT false;
