-- CreateEnum
CREATE TYPE "ArquivoTipo" AS ENUM ('FOTO_ALUNO', 'CONTRATO', 'OUTRO');

-- CreateTable
CREATE TABLE "Arquivo" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" "ArquivoTipo" NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Arquivo_usuarioId_idx" ON "Arquivo"("usuarioId");

-- CreateIndex
CREATE INDEX "Arquivo_tipo_idx" ON "Arquivo"("tipo");

-- CreateIndex
CREATE INDEX "Arquivo_criadoEm_idx" ON "Arquivo"("criadoEm");

-- AddForeignKey
ALTER TABLE "Arquivo" ADD CONSTRAINT "Arquivo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
