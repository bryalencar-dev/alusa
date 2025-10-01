import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WizardContextValue } from '../types';

const formas = [
  { v: 'DINHEIRO', l: 'Dinheiro' },
  { v: 'PIX', l: 'PIX' },
  { v: 'CARTAO', l: 'Cartão' },
  { v: 'BOLETO', l: 'Boleto' },
];

interface StepFinanceiroProps { ctx: WizardContextValue; }

export function StepFinanceiro({ ctx }: StepFinanceiroProps) {
  const { state, update, goNext, goBack } = ctx;
  const [localTaxa, setLocalTaxa] = useState(state.taxaMatricula?.toString() ?? '');
  const [localDescontoValor, setLocalDescontoValor] = useState(state.descontoValor?.toString() ?? '');
  const [localDescontoTipo, setLocalDescontoTipo] = useState(state.descontoTipo ?? 'FIXO');
  const [dataInicio, setDataInicio] = useState(state.dataInicio ?? new Date().toISOString().slice(0,10));
  const [vencimento, setVencimento] = useState(state.vencimentoDia?.toString() ?? '5');

  const planoValor = state.planoValor ?? 0;
  const descontoValorNum = Number(localDescontoValor.replace(',', '.')) || 0;
  const descontoAplicado = localDescontoTipo === 'FIXO' ? descontoValorNum : (planoValor * descontoValorNum) / 100;
  const valorFinal = Math.max(planoValor - descontoAplicado, 0);

  const canContinue = !!state.planoId && !!state.formaPagamento;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="flex flex-col gap-1.5">
          <label className="font-medium">Data de início</label>
          <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-medium">Dia vencimento</label>
            <Input type="number" min={1} max={28} value={vencimento} onChange={e=> setVencimento(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="font-medium">Forma pagamento</label>
          <Select value={state.formaPagamento ?? ''} onValueChange={(v)=> update({ formaPagamento: v as any })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {formas.map(f => <SelectItem key={f.v} value={f.v}>{f.l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-medium">Taxa matrícula (R$)</label>
          <Input value={localTaxa} onChange={e => setLocalTaxa(e.target.value)} placeholder="0,00" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-medium">Desconto</label>
          <div className="flex gap-2">
            <Select value={localDescontoTipo} onValueChange={v => setLocalDescontoTipo(v as any)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXO">Fixo</SelectItem>
                <SelectItem value="PERCENTUAL">%</SelectItem>
              </SelectContent>
            </Select>
            <Input className="flex-1" value={localDescontoValor} onChange={e=> setLocalDescontoValor(e.target.value)} placeholder={localDescontoTipo==='PERCENTUAL' ? '0%' : '0,00'} />
          </div>
        </div>
      </div>

      <div className="rounded border p-3 bg-gray-50 text-xs space-y-1">
        <p><span className="font-medium">Plano base:</span> R$ {planoValor.toFixed(2)}</p>
        <p><span className="font-medium">Desconto aplicado:</span> R$ {descontoAplicado.toFixed(2)}</p>
        <p><span className="font-medium">Mensalidade final:</span> R$ {valorFinal.toFixed(2)}</p>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={goBack}>Voltar</Button>
        <Button type="button" disabled={!canContinue} onClick={() => {
          update({
            taxaMatricula: Number(localTaxa.replace(',', '.')) || 0,
            descontoTipo: localDescontoTipo as any,
            descontoValor: descontoValorNum,
            vencimentoDia: Number(vencimento) || 5,
            dataInicio,
          });
          goNext();
        }}>Próximo</Button>
      </div>
    </div>
  );
}
