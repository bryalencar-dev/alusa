// Alias legado: /login -> redireciona para /auth/login (rota canônica)
import { redirect } from 'next/navigation';

export default function LegacyLoginAlias() { redirect('/auth/login'); }
