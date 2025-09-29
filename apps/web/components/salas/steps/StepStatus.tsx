'use client';
import { useFormContext } from 'react-hook-form';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface SalaWizardValues {
  status?: 'ATIVO' | 'INATIVO';
}
export default function StepStatus() {
  const { setValue, watch } = useFormContext<SalaWizardValues>();
  const status = watch('status') || 'ATIVO';
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-slate-600">Status</label>
        <Select value={status} onValueChange={(v) => setValue('status', v as 'ATIVO' | 'INATIVO')}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ATIVO">Ativo</SelectItem>
            <SelectItem value="INATIVO">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
