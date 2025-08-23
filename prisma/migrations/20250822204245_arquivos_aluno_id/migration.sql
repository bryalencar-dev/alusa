-- AlterTable
ALTER TABLE "Arquivo" ADD COLUMN     "alunoId" TEXT;

-- CreateIndex
CREATE INDEX "Arquivo_alunoId_idx" ON "Arquivo"("alunoId");

-- AddForeignKey
ALTER TABLE "Arquivo" ADD CONSTRAINT "Arquivo_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;
