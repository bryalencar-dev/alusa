import { redirect } from 'next/navigation';
// LEGACY: rota antiga /recepcao/alunos agora redireciona para a rota consolidada /admin/alunos
export default function LegacyAlunosRedirect(){ redirect('/admin/alunos'); }
