import { NotificationPreferencesForm } from '@/features/account/components/NotificationPreferencesForm';

export default function ContaNotificacoesPage() {
  return (
    <section
      aria-labelledby="notificacoes-title"
      className="space-y-6 rounded-lg bg-white p-6 md:p-8"
    >
      <header className="space-y-1">
        <h2
          id="notificacoes-title"
          className="text-xl md:text-2xl font-medium tracking-tight text-gray-900"
        >
          Notificações
        </h2>
        <p className="text-sm text-gray-600">
          Defina suas preferências de e-mail, WhatsApp e SMS.
        </p>
      </header>
      <NotificationPreferencesForm />
    </section>
  );
}
