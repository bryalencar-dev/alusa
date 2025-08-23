-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'PROFESSOR', 'RESPONSAVEL', 'ALUNO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "perfil" "PerfilUsuario" NOT NULL DEFAULT 'ALUNO';
