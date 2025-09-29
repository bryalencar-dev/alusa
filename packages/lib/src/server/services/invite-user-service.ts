import { PrismaClient, Role } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export class DuplicateInviteError extends Error { constructor(){ super('Convite pendente já existe para este e-mail.'); } }
export class UserAlreadyExistsError extends Error { constructor(){ super('Usuário já cadastrado com este e-mail.'); } }
export class ForbiddenRoleError extends Error { constructor(){ super('Convites para ADMIN não são permitidos.'); } }
export class InvalidInviteError extends Error { constructor(){ super('Convite inválido.'); } }
export class ExpiredInviteError extends Error { constructor(){ super('Convite expirado.'); } }
export class OwnerRestrictionError extends Error { constructor(){ super('Operação não permitida para Owner.'); } }
export class MissingContaError extends Error { constructor(){ super('Conta do convidador não encontrada.'); } }

/**
 * Verifica se o usuário alvo é o Owner da conta.
 * Útil para serviços de usuário que precisam bloquear exclusão/desativação/rebaixamento.
 */
export async function isOwner(userId: string): Promise<boolean> {
  const user = await prisma.usuario.findUnique({ where: { id: userId }, select: { contaId: true, id: true } });
  if (!user?.contaId) return false;
  const conta = await prisma.conta.findUnique({ where: { id: user.contaId }, select: { ownerUserId: true } });
  return !!(conta && conta.ownerUserId === userId);
}

export async function createInvite(email: string, role: Role, invitedById: string, contaId?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (role === Role.ADMIN) throw new ForbiddenRoleError();

  // Se usuário já existe, não convide
  const existingUser = await prisma.usuario.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw new UserAlreadyExistsError();

  // Descobrir contaId caso não informado
  let targetContaId = contaId || null;
  if (!targetContaId) {
    const inviter = await prisma.usuario.findUnique({ where: { id: invitedById } });
    targetContaId = inviter?.contaId ?? null;
  }
  // Para coerência multi-tenant e do índice único, novas criações DEVEM carregar contaId
  if (!targetContaId) throw new MissingContaError();

  // Evitar convite duplicado pendente por (contaId,email,status)
  const dup = await prisma.invite.findFirst({ where: { contaId: targetContaId, email: normalizedEmail, status: 'PENDING' } });
  if (dup) throw new DuplicateInviteError();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const token = randomUUID();

  const created = await prisma.invite.create({
    data: {
      contaId: targetContaId,
      email: normalizedEmail,
      role,
      token,
      invitedById,
      status: 'PENDING',
      expiresAt,
    }
  });
  return created;
}

export async function acceptInvite(token: string, nome: string, senhaHash: string) {
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.status !== 'PENDING') throw new InvalidInviteError();
  if (invite.expiresAt.getTime() <= Date.now()) throw new ExpiredInviteError();

  // Conta alvo: do convite ou do convidador
  let contaId: string | null = invite.contaId ?? null;
  if (!contaId) {
    const inviter = await prisma.usuario.findUnique({ where: { id: invite.invitedById } });
    contaId = inviter?.contaId ?? null;
  }
  if (!contaId) throw new InvalidInviteError();

  const email = invite.email.toLowerCase().trim();
  const exists = await prisma.usuario.findUnique({ where: { email } });
  if (exists) throw new UserAlreadyExistsError();

  const role = invite.role === 'ADMIN' ? Role.RESPONSAVEL : invite.role as Role;

  const user = await prisma.usuario.create({ data: { contaId, nome, email, senhaHash, role } });
  await prisma.invite.update({ where: { id: invite.id }, data: { status: 'ACCEPTED', acceptedByUserId: user.id, acceptedAt: new Date() } });

  // Vincular Responsável existente com mesmo e-mail, se houver (contrato: vincula usuarioId)
  // Usa cast para compatibilidade com possíveis versões do Prisma Client durante migrações
  try {
  const anyPrisma = prisma as unknown as { responsavel: { updateMany: (_args: { where: { email: string }; data: { usuarioId: string } }) => Promise<unknown> } };
    if (anyPrisma?.responsavel?.updateMany) {
      await anyPrisma.responsavel.updateMany({ where: { email }, data: { usuarioId: user.id } });
    }
  } catch {
    // Ignorar silenciosamente para evitar quebrar aceite em casos legados
  }

  // Vincular Aluno existente na mesma conta com mesmo e-mail, se houver
  try {
    // Aluno tem chave composta (contaId,email) única; filtrar por contaId + email
    const anyPrisma = prisma as unknown as { aluno: { updateMany: (_args: { where: { contaId: string; email: string | null }; data: { usuarioId: string } }) => Promise<unknown> } };
    if (anyPrisma?.aluno?.updateMany) {
      await anyPrisma.aluno.updateMany({ where: { contaId, email }, data: { usuarioId: user.id } });
    }
  } catch {
    // Ignorar silenciosamente para compatibilidade
  }

  return user;
}

export async function listInvitesByConta(contaId: string) {
  return prisma.invite.findMany({ where: { contaId, status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
}

export async function getInviteById(id: string) {
  return prisma.invite.findUnique({ where: { id } });
}

export async function cancelInviteById(id: string): Promise<boolean> {
  const found = await prisma.invite.findUnique({ where: { id } });
  if (!found || String(found.status).toUpperCase() !== 'PENDING') return false;
  await prisma.invite.update({ where: { id }, data: { status: 'REVOKED' } });
  return true;
}
