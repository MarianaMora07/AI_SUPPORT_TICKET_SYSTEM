import { NewTicketForm } from '@/src/components/tickets/NewTicketForm';

export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-900">Crear ticket</h1>
        <p className="mt-2 text-sm text-muted">
          Describe claramente el incidente para agilizar la atención.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NewTicketForm />
        </div>

        <aside className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
            Guía rápida
          </p>
          <h2 className="mt-1 text-xl font-bold text-brand-900">
            Cómo crear un ticket correctamente
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>1. Usa un título breve y específico del problema.</li>
            <li>2. Selecciona la categoría más cercana al incidente.</li>
            <li>3. Describe pasos, errores y contexto en detalle.</li>
            <li>4. Si aplica, indica impacto para priorizar mejor.</li>
            <li>5. Evita datos sensibles en el mensaje.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
