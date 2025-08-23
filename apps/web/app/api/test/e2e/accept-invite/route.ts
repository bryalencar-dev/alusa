import { NextResponse } from "next/server";
import { z } from "zod";
import { assertNonProd } from "../../_guard";
import { prisma } from "../../../../../lib/prisma";
import { RoleName } from "@prisma/client";

const Body = z.object({
  token: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  passwordHash: z.string().min(10).optional(),
  role: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    assertNonProd();
    const { token, email: emailIn, password, passwordHash, role } = Body.parse(await req.json());
    let email = emailIn;
    if (token && !email) {
      try {
        const inv = await prisma.invite.findUnique({ where: { token } });
        email = inv?.email;
      } catch {/* tabela pode não existir */}
    }
    if(!email) throw new Error('email não resolvido');
    console.log('[accept-invite] body', { token, email, hasPassword: Boolean(password), hasPasswordHash: Boolean(passwordHash), role });

    let senhaHash = passwordHash;
    if (!senhaHash && password) {
      const bcrypt = await import("bcryptjs");
      senhaHash = await bcrypt.hash(password, 10);
    }

    let user: unknown = null;

    // Tenta modelo user (schema atual). Necessário fornecer roleId obrigatório.
    try {
      const desiredRoleName: RoleName = role?.toUpperCase() === 'ADMIN' ? RoleName.ADMIN : RoleName.USER;
      let roleRec = await prisma.role.findFirst({ where: { name: desiredRoleName } });
      if (!roleRec) {
        roleRec = await prisma.role.create({ data: { name: desiredRoleName } });
      }
      user = await prisma.user.upsert({
        where: { email },
        update: { ...(senhaHash ? { senhaHash } : {}), roleId: roleRec.id },
        create: { email, senhaHash: senhaHash ?? '', roleId: roleRec.id },
      });
    } catch (e) {
      // Fallback eventual legacy (usuario) se existir no client gerado
      try {
        const anyPrisma = prisma as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (anyPrisma.usuario) {
          user = await anyPrisma.usuario.upsert({
            where: { email },
            update: { ...(senhaHash ? { senhaHash } : {}), status: 'ATIVO' },
            create: { email, nome: email.split('@')[0], senhaHash: senhaHash ?? '', status: 'ATIVO' },
          });
        }
      } catch (e2) {
        return NextResponse.json({ success: false, error: 'Falha ao criar usuário' }, { status: 400 });
      }
    }

    // Invite fallback (marca usedAt se existir tabela)
    try {
      await (prisma as any).invite.updateMany({ // eslint-disable-line @typescript-eslint/no-explicit-any
        where: { email, usedAt: null },
        data: { usedAt: new Date() },
      });
    } catch (invErr) {
      console.warn("Tabela invite ausente ou erro ao atualizar:", (invErr as Error).message);
    }

  console.log('[accept-invite] success userId', (user as any)?.id); // eslint-disable-line @typescript-eslint/no-explicit-any
  return NextResponse.json({ success: true, userId: (user as any)?.id }, { status: 200 }); // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch (err) {
    const status = 400;
  console.warn('[accept-invite] error', (err as Error).message);
    return NextResponse.json({ success: false, error: String((err as Error).message) }, { status });
  }
}