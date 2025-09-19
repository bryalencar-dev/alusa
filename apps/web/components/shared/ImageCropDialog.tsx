"use client";

import * as React from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';

export interface ImageCropDialogProps {
  src: string | null;               // dataURL ou objectURL da imagem
  open: boolean;                    // controla visibilidade do modal
  aspect?: number;                  // razão (default 1)
  onClose: () => void;              // fechar sem aplicar
  onApply: (_dataUrl: string) => void; // aplicar recorte
  title?: string;                   // título opcional
  maxZoom?: number;                 // limite de zoom (default 3)
  mimeType?: string;                // mime final (default image/jpeg)
  quality?: number;                 // qualidade jpeg (0..1)
  roundPreview?: boolean;           // exibir dica/preview redondo futura?
  className?: string;               // estilização externa opcional
}

// Helper util local (pode ser movido para utils se surgir outro uso)
async function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export function ImageCropDialog({
  src,
  open,
  aspect = 1,
  onClose,
  onApply,
  title = 'Ajustar corte',
  maxZoom = 3,
  mimeType = 'image/jpeg',
  quality = 0.9,
  className,
}: ImageCropDialogProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<import('react-easy-crop').Area | null>(null);

  // Reset interno sempre que abrir/fechar ou trocar a imagem
  React.useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [open, src]);

  const onCropComplete = React.useCallback((_: import('react-easy-crop').Area, areaPixels: import('react-easy-crop').Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleApply() {
    if (!src || !croppedAreaPixels) return;
    try {
      const image = await createImage(src);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { width, height, x, y } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
      const dataUrl = canvas.toDataURL(mimeType, quality);
      onApply(dataUrl);
    } catch (err) {
      console.error('Erro ao gerar recorte', err);
    }
  }

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 ${className || ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg space-y-4">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <div className="relative h-72 w-full overflow-hidden rounded-md bg-slate-900/5">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="cover"
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={maxZoom}
            step={0.05}
            value={zoom}
            aria-label="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
          <span className="text-[11px] text-slate-500 w-10 text-right">{zoom.toFixed(2)}x</span>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            autoFocus
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-violet-600 text-white hover:bg-violet-700"
            onClick={handleApply}
          >
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropDialog;
