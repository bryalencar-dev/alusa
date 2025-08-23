/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Billing` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EventoStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "EventoTipo" AS ENUM ('WORKSHOP', 'APRESENTACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "InscricaoEventoStatus" AS ENUM ('RESERVADO', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO', 'BOLETO');

-- CreateEnum
CREATE TYPE "PagamentoEventoStatus" AS ENUM ('CONFIRMADO', 'ESTORNADO');

-- AlterTable
ALTER TABLE "Billing" DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "Conta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsavel" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Responsavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "local" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "capacidade" INTEGER,
    "tipo" "EventoTipo" NOT NULL,
    "status" "EventoStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoIngresso" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "qtdDisponivel" INTEGER NOT NULL,

    CONSTRAINT "TipoIngresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscricaoEvento" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "tipoIngressoId" TEXT NOT NULL,
    "alunoId" TEXT,
    "responsavelId" TEXT,
    "externo" BOOLEAN NOT NULL DEFAULT false,
    "quantidade" INTEGER NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "status" "InscricaoEventoStatus" NOT NULL DEFAULT 'RESERVADO',
    "dataReg" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscricaoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagamentoEvento" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "valorPago" DECIMAL(10,2) NOT NULL,
    "status" "PagamentoEventoStatus" NOT NULL DEFAULT 'CONFIRMADO',
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "comprovante" TEXT,

    CONSTRAINT "PagamentoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingresso" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "usadoPorUserId" TEXT,
    "usadoDevice" TEXT,

    CONSTRAINT "Ingresso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Responsavel_email_key" ON "Responsavel"("email");

-- CreateIndex
CREATE INDEX "Evento_contaId_idx" ON "Evento"("contaId");

-- CreateIndex
CREATE INDEX "TipoIngresso_eventoId_idx" ON "TipoIngresso"("eventoId");

-- CreateIndex
CREATE INDEX "InscricaoEvento_eventoId_idx" ON "InscricaoEvento"("eventoId");

-- CreateIndex
CREATE INDEX "InscricaoEvento_tipoIngressoId_idx" ON "InscricaoEvento"("tipoIngressoId");

-- CreateIndex
CREATE INDEX "InscricaoEvento_alunoId_idx" ON "InscricaoEvento"("alunoId");

-- CreateIndex
CREATE INDEX "InscricaoEvento_responsavelId_idx" ON "InscricaoEvento"("responsavelId");

-- CreateIndex
CREATE INDEX "PagamentoEvento_inscricaoId_idx" ON "PagamentoEvento"("inscricaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingresso_qrCode_key" ON "Ingresso"("qrCode");

-- CreateIndex
CREATE INDEX "Ingresso_inscricaoId_idx" ON "Ingresso"("inscricaoId");

-- CreateIndex
CREATE INDEX "Ingresso_usadoPorUserId_idx" ON "Ingresso"("usadoPorUserId");

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoIngresso" ADD CONSTRAINT "TipoIngresso_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoEvento" ADD CONSTRAINT "InscricaoEvento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoEvento" ADD CONSTRAINT "InscricaoEvento_tipoIngressoId_fkey" FOREIGN KEY ("tipoIngressoId") REFERENCES "TipoIngresso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoEvento" ADD CONSTRAINT "InscricaoEvento_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoEvento" ADD CONSTRAINT "InscricaoEvento_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoEvento" ADD CONSTRAINT "PagamentoEvento_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "InscricaoEvento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingresso" ADD CONSTRAINT "Ingresso_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "InscricaoEvento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingresso" ADD CONSTRAINT "Ingresso_usadoPorUserId_fkey" FOREIGN KEY ("usadoPorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
