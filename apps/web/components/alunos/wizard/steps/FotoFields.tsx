'use client';

import { Button } from '@/components/ui/button';
import * as React from 'react';

type Props = {
  fotoPreview: string | null;
  avatarFallback: string;
  onEdit: () => void;
  onReplace: () => void; // abre input de arquivo
  onRemove: () => void;
};

export default function FotoFields({
  fotoPreview,
  avatarFallback,
  onEdit,
  onReplace,
  onRemove,
}: Props) {
  const [dragActive, setDragActive] = React.useState(false);
  const hasFoto = !!fotoPreview;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // delega seleção para o handler externo (abre cropping depois)
      onReplace();
    }
  };

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      {/* Coluna esquerda: preview + ações pós upload */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/60 md:h-36 md:w-36">
          {hasFoto ? (
            <img
              src={fotoPreview ?? ''}
              alt="Foto do aluno"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full select-none items-center justify-center text-lg font-semibold text-slate-500">
              {avatarFallback}
            </div>
          )}
        </div>
        {hasFoto && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              onClick={onEdit}
            >
              Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-300 bg-white text-red-600 hover:bg-red-50"
              onClick={onRemove}
            >
              Remover
            </Button>
          </div>
        )}
      </div>

      {/* Coluna direita: dropzone principal */}
      <div className="flex-1">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onClick={onReplace}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onReplace();
            }
          }}
          aria-label={hasFoto ? 'Substituir foto do aluno' : 'Adicionar foto do aluno'}
          className={
            'group relative flex flex-col items-center justify-center rounded-md border border-dashed px-6 py-10 text-center transition ' +
            (dragActive
              ? 'border-brand-accent bg-brand-accent/5'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50')
          }
        >
          {!hasFoto && (
            <>
              <div className="text-sm font-medium text-slate-700">Arraste uma imagem aqui</div>
              <div className="my-3 flex w-full items-center gap-3 text-[11px] font-medium text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>ou</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onReplace();
                }}
                className="bg-brand-accent text-white hover:bg-brand-accent/90 shadow-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
              >
                Carregar foto
              </Button>
              <div className="mt-4 space-y-1">
                <div className="text-xs text-slate-500">JPG ou PNG até 5MB</div>
                <div className="text-[11px] text-slate-500">Use imagens quadradas e bem iluminadas; o recorte será ajustado depois.</div>
              </div>
            </>
          )}
          {hasFoto && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Arraste ou clique para substituir</div>
              <div className="text-xs text-slate-500">JPG ou PNG até 5MB</div>
            </div>
          )}
          {hasFoto && (
            <div className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-slate-200 group-hover:ring-slate-300" />
          )}
        </div>
      </div>
    </div>
  );
}
