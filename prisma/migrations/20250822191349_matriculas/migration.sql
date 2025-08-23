-- CreateEnum
CREATE TYPE "MatriculaStatus" AS ENUM ('ATIVA', 'CANCELADA', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "DescontoTipo" AS ENUM ('PERCENTUAL', 'FIXO');

-- CreateEnum
CREATE TYPE "DescontoEscopo" AS ENUM ('MATRICULA', 'MENSALIDADE', 'COMBO');

-- CreateTable
CREATE TABLE "Aluno" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "asaasCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turma" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "inicio" TIMESTAMP(3),
    "fim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plano" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "mensalidade" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matricula" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "status" "MatriculaStatus" NOT NULL DEFAULT 'ATIVA',
    "taxaMatricula" DECIMAL(10,2),
    "asaasId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Desconto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "DescontoTipo" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "escopo" "DescontoEscopo" NOT NULL,
    "cumulativo" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Desconto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DescontoMatricula" (
    "matriculaId" TEXT NOT NULL,
    "descontoId" TEXT NOT NULL,
    "valorFinal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "DescontoMatricula_pkey" PRIMARY KEY ("matriculaId","descontoId")
);

-- CreateTable
CREATE TABLE "WebhookAsaasLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookAsaasLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_cpfCnpj_key" ON "Aluno"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_asaasCustomerId_key" ON "Aluno"("asaasCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_asaasId_key" ON "Matricula"("asaasId");

-- CreateIndex
CREATE INDEX "Matricula_alunoId_idx" ON "Matricula"("alunoId");

-- CreateIndex
CREATE INDEX "Matricula_turmaId_idx" ON "Matricula"("turmaId");

-- CreateIndex
CREATE INDEX "Matricula_planoId_idx" ON "Matricula"("planoId");

-- CreateIndex
CREATE INDEX "DescontoMatricula_descontoId_idx" ON "DescontoMatricula"("descontoId");

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "Plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescontoMatricula" ADD CONSTRAINT "DescontoMatricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescontoMatricula" ADD CONSTRAINT "DescontoMatricula_descontoId_fkey" FOREIGN KEY ("descontoId") REFERENCES "Desconto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
