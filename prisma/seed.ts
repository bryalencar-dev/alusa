import { PrismaClient, RoleName, PerfilUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertByEnglish(email: string, name: string, role: string, hash: string) {
  const roleName: RoleName = role === 'ADMIN' ? RoleName.ADMIN : RoleName.USER;
  const perfil: PerfilUsuario = role === 'ADMIN' ? PerfilUsuario.ADMIN : role === 'PROFESSOR' ? PerfilUsuario.PROFESSOR : role === 'RESPONSAVEL' ? PerfilUsuario.RESPONSAVEL : PerfilUsuario.ALUNO;
  let roleId: string | undefined;
  try {
    const r = await prisma.role.findFirst({ where: { name: roleName } });
    roleId = r?.id;
  } catch { /* ignore */ }
  if (!roleId) {
    try {
      const createdRole = await prisma.role.create({ data: { name: roleName } });
      roleId = createdRole.id;
    } catch { /* ignore */ }
  }
  return prisma.user.upsert({
    where: { email },
    update: { senhaHash: hash, perfil, roleId: roleId! },
    create: { email, senhaHash: hash, perfil, roleId: roleId! }
  });
}

async function ensurePerfil(nome: string) {
  try {
    // @ts-expect-error schema opcional
    return await prisma.perfil.upsert({ where: { nome }, update: {}, create: { nome } });
  } catch { return null; }
}

async function upsertByPtBr(email: string, nome: string, role: string, hash: string) {
  const anyPrisma = prisma as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!anyPrisma.usuario) throw new Error('legacy usuario schema ausente');
  const u = await anyPrisma.usuario.upsert({
    where: { email },
    update: { senhaHash: hash, status: 'ATIVO', nome },
    create: { email, nome, senhaHash: hash, status: 'ATIVO' }
  });
  const perfil = await ensurePerfil(role);
  if (perfil) {
    try {
      if (anyPrisma.usuarioPerfil) { // eslint-disable-line @typescript-eslint/no-explicit-any
        await anyPrisma.usuarioPerfil.upsert({
          where: { usuarioId_perfilId: { usuarioId: u.id, perfilId: perfil.id } },
          update: {},
          create: { usuarioId: u.id, perfilId: perfil.id }
        });
      }
    } catch { /* ignore vínculo */ }
  }
  return u;
}

async function main() {
  const pass = 'senha123';
  const hash = await bcrypt.hash(pass, 10);
  const users = [
    { email: 'aluno@example.com', nome: 'Aluno Admin', role: 'ADMIN' },
    { email: 'professor@example.com', nome: 'Professor', role: 'PROFESSOR' },
    { email: 'responsavel@example.com', nome: 'Responsável', role: 'RESPONSAVEL' },
  ];
  for (const u of users) {
    try {
      await upsertByEnglish(u.email, u.nome, u.role, hash);
      console.log('[seed] User OK:', u.email, u.role);
    } catch {
      await upsertByPtBr(u.email, u.nome, u.role, hash);
      console.log('[seed] Usuario OK:', u.email, u.role);
    }
  }
  console.log('[seed] concluída');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());