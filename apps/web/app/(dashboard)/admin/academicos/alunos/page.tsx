import Link from 'next/link';

export default function AcademicosAlunosIndex() {
	return (
		<div className="p-6 space-y-3">
			<p>Abra a lista de alunos:</p>
			<Link className="text-violet-700 underline" href="/admin/alunos">/admin/alunos</Link>
		</div>
	);
}

