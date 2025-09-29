'use client';
import { Button } from '@/components/ui/button';

type Props = {
  fotoPreview: string | null;
  avatarFallback: string;
  onEdit: () => void;
  onReplace: () => void;
  onRemove: () => void;
};

export default function FotoFields({
  fotoPreview,
  avatarFallback,
  onEdit,
  onReplace,
  onRemove,
}: Props) {
  const hasFoto = Boolean(fotoPreview);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex items-center justify-center">
          <div className="relative h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm md:h-36 md:w-36">
            {hasFoto ? (
              <img
                src={fotoPreview ?? ''}
                alt="Foto do aluno"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
                {avatarFallback}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm text-slate-600">
            A foto é opcional, mas facilita a identificação rápida do aluno em chamadas,
            carteirinhas e relatórios. Prefira imagens quadradas e bem iluminadas.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              onClick={onEdit}
              disabled={!hasFoto}
            >
              Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              onClick={onReplace}
            >
              {hasFoto ? 'Substituir' : 'Enviar foto'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-red-50 text-red-600 shadow-none hover:bg-red-100"
              onClick={onRemove}
              disabled={!hasFoto}
            >
              Remover
            </Button>
          </div>
          <p className="text-xs text-slate-500">Formatos suportados: JPG ou PNG até 5MB.</p>
        </div>
      </div>
    </div>
  );
}
