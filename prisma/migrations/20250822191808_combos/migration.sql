-- CreateEnum
CREATE TYPE "ComboStatus" AS ENUM ('ATIVO', 'INATIVO');

-- DropForeignKey
ALTER TABLE "Matricula" DROP CONSTRAINT "Matricula_turmaId_fkey";

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "comboId" TEXT,
ALTER COLUMN "turmaId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Combo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "ComboStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Combo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboTurma" (
    "comboId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,

    CONSTRAINT "ComboTurma_pkey" PRIMARY KEY ("comboId","turmaId")
);

-- CreateIndex
CREATE INDEX "ComboTurma_turmaId_idx" ON "ComboTurma"("turmaId");

-- CreateIndex
CREATE INDEX "Matricula_comboId_idx" ON "Matricula"("comboId");

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboTurma" ADD CONSTRAINT "ComboTurma_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboTurma" ADD CONSTRAINT "ComboTurma_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
