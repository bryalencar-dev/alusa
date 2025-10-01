'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
// Constante de debounce pode ficar em nível de módulo (não é hook)
const DEBOUNCE_MS = 500;
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import CardHeader from '@/components/layout/CardHeader';
import useCurrentUser from '@/hooks/use-current-user';
import ModalidadeDialog from '@/components/modalidades/ModalidadeDialog';
import SalaDialog from '@/components/salas/SalaDialog';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';
import { createModalidade } from '@/features/cadastro/modalidades/services/modalidades-service';
import { createSala } from '@/features/cadastro/salas/services/salas-service';

/** Espaçamentos já validados por você */
const CONTENT_GAP_PX = 12;
const OUTER_PADDING_TOP_PX = 20;
const OUTER_PADDING_RIGHT_PX = 24; // igual ao padding inferior
const OUTER_PADDING_BOTTOM_PX = 24;
const CARD_PADDING_PX = 32;
const CARD_RADIUS_PX = 40;
const CARD_SHADOW =
  'rgba(14, 63, 126, 0.06) 0px 0px 0px 1px, rgba(42, 51, 70, 0.03) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 2px 2px -1px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.03) 0px 5px 5px -2.5px, rgba(42, 51, 70, 0.03) 0px 10px 10px -5px, rgba(42, 51, 70, 0.03) 0px 24px 24px -8px';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useSession(); // mantém hidratação de sessão caso necessário

  // Health ping em dev
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      const w = window as unknown as { __alusaHealthCalled?: boolean };
      if (!w.__alusaHealthCalled) {
        w.__alusaHealthCalled = true;
        fetch('/api/health', { cache: 'no-store' }).catch(() => {});
      }
    }
  }, []);

  // largura inicial da sidebar
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (!root.style.getPropertyValue('--sidebar-w')) {
        root.style.setProperty('--sidebar-w', '262px');
      }
    }
  }, []);

  // Regra solicitada: Sidebar SEMPRE exibida nas páginas dentro de (app)
  // (Mantemos session effect/health ping para consistência.)

  return (
    <div className="relative min-h-screen w-full app-surface-bg">
      <Sidebar />

      <main
        className="with-sidebar transition-[padding-left] duration-300 ease-in-out overflow-visible"
        style={{ ['--sidebar-gap' as string]: `${CONTENT_GAP_PX}px` } as Record<string, string>}
      >
        <div
          style={{
            paddingTop: OUTER_PADDING_TOP_PX,
            paddingRight: OUTER_PADDING_RIGHT_PX,
            paddingBottom: OUTER_PADDING_BOTTOM_PX,
          }}
          className="overflow-visible"
        >
          <div
            className="w-full transition-[width] duration-300 ease-in-out overflow-visible"
            style={{
              minHeight: `calc(100vh - ${OUTER_PADDING_TOP_PX + OUTER_PADDING_BOTTOM_PX}px)`,
              background: '#FFFFFF',
              borderRadius: CARD_RADIUS_PX,
              padding: CARD_PADDING_PX,
              boxShadow: CARD_SHADOW,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <CardHeader />
            <div className="mt-6">{children}</div>
            <GlobalQuickCreatePortals />
          </div>
        </div>
      </main>
    </div>
  );
}

// Portal global para tratar eventos de criação disparados em selects (ex.: TurmaDialog)
function GlobalQuickCreatePortals() {
  const { user } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  // Refs de controle de debounce DEVEM estar dentro do componente (hooks não podem ser usados no módulo)
  const lastOpenModalidadeRef = useRef(0);
  const lastOpenSalaRef = useRef(0);

  const [openModalidade, setOpenModalidade] = useState(false);
  const [openSala, setOpenSala] = useState(false);

  // Estados de formulário simplificados
  const [modalidadeForm, setModalidadeForm] = useState({
    nome: '',
    descricao: '',
    status: 'ATIVO',
  });
  const [salaForm, setSalaForm] = useState({
    nome: '',
    descricao: '',
    capacidade: '',
    status: 'ATIVO',
  });
  const [submitting, setSubmitting] = useState(false);

  const resetModalidade = useCallback(() => {
    setModalidadeForm({ nome: '', descricao: '', status: 'ATIVO' });
  }, []);
  const resetSala = useCallback(() => {
    setSalaForm({ nome: '', descricao: '', capacidade: '', status: 'ATIVO' });
  }, []);

  useEffect(() => {
    function handleOpenModalidade() {
      const now = Date.now();
      if (openModalidade || now - lastOpenModalidadeRef.current < DEBOUNCE_MS) return;
      lastOpenModalidadeRef.current = now;
      resetModalidade();
      setOpenModalidade(true);
    }
    function handleOpenSala() {
      const now = Date.now();
      if (openSala || now - lastOpenSalaRef.current < DEBOUNCE_MS) return;
      lastOpenSalaRef.current = now;
      resetSala();
      setOpenSala(true);
    }
    window.addEventListener('modalidade:dialog:new', handleOpenModalidade);
    window.addEventListener('sala:dialog:new', handleOpenSala);
    return () => {
      window.removeEventListener('modalidade:dialog:new', handleOpenModalidade);
      window.removeEventListener('sala:dialog:new', handleOpenSala);
    };
  }, [resetModalidade, resetSala, openModalidade, openSala]);

  async function handleCreateModalidade() {
    if (!contaId) {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Conta não encontrada"
          description="Não foi possível identificar a conta para salvar a modalidade."
          onClose={() => toast.dismiss(t)}
        />
      ));
      return;
    }
    if (submitting) return;
    try {
      setSubmitting(true);
      const created = await createModalidade({
        contaId,
        nome: modalidadeForm.nome.trim(),
        descricao: modalidadeForm.descricao.trim() || undefined,
        status: modalidadeForm.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
      });
      toast.custom((t) => (
        <CustomToast
          variant="success"
          title="Modalidade criada"
          description="A modalidade foi cadastrada."
          onClose={() => toast.dismiss(t)}
        />
      ));
      setOpenModalidade(false);
      window.dispatchEvent(new CustomEvent('modalidades:changed'));
      // Evento específico para selects que aguardam auto-seleção
      window.dispatchEvent(
        new CustomEvent('modalidade:created', { detail: { id: created.id, nome: created.nome } }),
      );
    } catch (e) {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Erro ao criar"
          description={(e as Error).message}
          onClose={() => toast.dismiss(t)}
        />
      ));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateSala() {
    if (!contaId) {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Conta não encontrada"
          description="Não foi possível identificar a conta para salvar a sala."
          onClose={() => toast.dismiss(t)}
        />
      ));
      return;
    }
    if (submitting) return;
    try {
      setSubmitting(true);
      const created = await createSala({
        contaId,
        nome: salaForm.nome.trim(),
        descricao: salaForm.descricao.trim() || undefined,
        capacidade: Number(salaForm.capacidade) || 0,
        status: salaForm.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
      });
      toast.custom((t) => (
        <CustomToast
          variant="success"
          title="Sala criada"
          description="A sala foi cadastrada."
          onClose={() => toast.dismiss(t)}
        />
      ));
      setOpenSala(false);
      window.dispatchEvent(new CustomEvent('salas:changed'));
      window.dispatchEvent(
        new CustomEvent('sala:created', { detail: { id: created.id, nome: created.nome } }),
      );
    } catch (e) {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Erro ao criar"
          description={(e as Error).message}
          onClose={() => toast.dismiss(t)}
        />
      ));
    } finally {
      setSubmitting(false);
    }
  }

  // Reaproveita componentes existentes para consistência visual
  return (
    <>
      <ModalidadeDialog
        open={openModalidade}
        creating
        modalidade={null}
        onOpenChange={(open) => {
          if (!open) setOpenModalidade(false);
        }}
        onSubmit={async (vals: { nome: string; descricao: string; status: string }) => {
          setModalidadeForm({
            nome: vals.nome,
            descricao: vals.descricao,
            status: vals.status,
          });
          await handleCreateModalidade();
        }}
      />
      <SalaDialog
        open={openSala}
        creating
        sala={null}
        onOpenChange={(open) => {
          if (!open) setOpenSala(false);
        }}
        onSubmit={async (vals) => {
          setSalaForm({
            nome: vals.nome,
            descricao: vals.descricao,
            capacidade: vals.capacidade,
            status: vals.status,
          });
          await handleCreateSala();
        }}
      />
    </>
  );
}
