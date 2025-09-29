// Inicializa mapa de erros em PT-BR para Zod
import './zod-error-map';

export * from './hooks/useIsClient';
export * from './math';
export * from './alunos/aluno.schema';
export * from './alunos/aluno.service';
export * from './services/matricula';
// Turmas
export * from './schemas/turma.schema';
export * from './services/turma.service';
// Modalidades e Salas
export * from './schemas/modalidade.schema';
export * from './schemas/sala.schema';
export * from './services/modalidade.service';
export * from './services/sala.service';
export * from './prisma';
// Planos
export * from './planos/planos-schema';
export * from './planos/planos-service';
// Professores
export * from './validators/professor';
export * from './schemas/professor';
export * as ProfessorRepo from './server/repositories/professor-repo';
export * as ProfessorService from './server/services/professor-service';
// Colaboradores
export * from './schemas/colaborador';
export * as ColaboradorService from './server/services/colaborador-service';
// Convites
export * as InviteService from './server/services/invite-service';
export * as InviteUserService from './server/services/invite-user-service';
// Utils de convite
export { buildInviteUrl } from './invite/build-invite-url';
// Utils
export * from './utils/format-name';
export * from './utils/mask';
