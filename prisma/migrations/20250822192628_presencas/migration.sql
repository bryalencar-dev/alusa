-- CreateEnum
CREATE TYPE "PresencaStatus" AS ENUM ('PRESENTE', 'FALTA', 'ATRASO');

-- CreateTable
CREATE TABLE "Presenca" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "dataAula" TIMESTAMP(3) NOT NULL,
    "status" "PresencaStatus" NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presenca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Presenca_turmaId_dataAula_idx" ON "Presenca"("turmaId", "dataAula");

-- CreateIndex
CREATE UNIQUE INDEX "Presenca_alunoId_turmaId_dataAula_key" ON "Presenca"("alunoId", "turmaId", "dataAula");

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
