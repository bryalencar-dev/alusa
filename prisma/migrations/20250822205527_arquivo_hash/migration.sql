-- AlterTable
ALTER TABLE "Arquivo" ADD COLUMN     "hashSha256" TEXT;

-- CreateIndex
CREATE INDEX "Arquivo_hashSha256_idx" ON "Arquivo"("hashSha256");
