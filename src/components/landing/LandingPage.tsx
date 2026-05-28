import { ButtonLink } from '@/src/components/ui/Button';
import { PublicFooter } from '@/src/components/layout/PublicFooter';
import { PublicHeader } from '@/src/components/layout/PublicHeader';

const features = [
  {
    title: 'Gestión de tickets',
    description:
      'Los usuarios reportan incidentes con categoría y prioridad. Agentes y administradores gestionan la cola desde un panel unificado.',
    icon: '🎫',
  },
  {
    title: 'Inteligencia artificial',
    description:
      'Google Gemini analiza cada ticket: resumen, clasificación, sugerencias de respuesta y nivel de riesgo, con revisión humana.',
    icon: '✨',
  },
  {
    title: 'Automatización n8n',
    description:
      'Confirmación por email al crear tickets, alertas Slack en prioridad alta y reportes diarios para managers.',
    icon: '⚡',
  },
  {
    title: 'Métricas y control',
    description:
      'Panel de analytics con totales, estados y tasas de resolución. Roles User, Agent y Admin con permisos RLS.',
    icon: '📊',
  },
];

const steps = [
  { step: '1', title: 'Regístrate', text: 'Crea tu cuenta como usuario o accede con credenciales de agente/admin.' },
  { step: '2', title: 'Reporta o atiende', text: 'Abre tickets con detalle o trabaja la cola priorizada del equipo.' },
  { step: '3', title: 'IA y notificaciones', text: 'Obtén sugerencias automáticas y recibe alertas sin salir del flujo.' },
];

const roles = [
  { name: 'Usuario', desc: 'Crea y consulta el estado de sus tickets.' },
  { name: 'Agente', desc: 'Atiende la cola, comenta y usa análisis IA.' },
  { name: 'Admin', desc: 'Gestiona usuarios, métricas y integraciones.' },
];

export function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-mesh">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:pb-28">
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl" />

          <div className="relative mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="animate-fade-up mb-4 inline-flex items-center rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-brand-700 shadow-sm">
                Plataforma empresarial de soporte técnico
              </p>
              <h1 className="animate-fade-up animation-delay-100 text-4xl font-bold leading-tight tracking-tight text-brand-900 sm:text-5xl lg:text-6xl">
                Resuelve incidentes con{' '}
                <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                  IA y automatización
                </span>
              </h1>
              <p className="animate-fade-up animation-delay-200 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
                TicketSystem centraliza solicitudes de soporte, prioriza con inteligencia
                artificial y mantiene informados a usuarios y equipos mediante flujos
                automatizados en tiempo real.
              </p>
              <div className="animate-fade-up animation-delay-300 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <ButtonLink href="/login" variant="primary" className="min-w-[180px] px-8 py-3 text-base">
                  Iniciar sesión
                </ButtonLink>
                <ButtonLink href="/register" variant="secondary" className="min-w-[180px] px-8 py-3 text-base">
                  Crear cuenta
                </ButtonLink>
              </div>
            </div>

            {/* Stats preview */}
            <div className="animate-fade-up animation-delay-400 mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
              {[
                { label: 'User stories', value: '8' },
                { label: 'Roles', value: '3' },
                { label: 'Integraciones', value: 'IA + n8n' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border bg-surface p-6 text-center shadow-lg shadow-brand-900/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <p className="text-3xl font-bold text-brand-600">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="caracteristicas" className="border-y border-border bg-surface px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
                Módulos del sistema
              </p>
              <h2 className="text-3xl font-bold text-brand-900">¿Qué ofrece el sistema?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted">
                Diseñado para equipos de TI y soporte que necesitan trazabilidad, velocidad y
                visibilidad en cada incidente.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <article
                  key={f.title}
                  className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-lg hover:shadow-brand-600/10"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-2xl transition group-hover:scale-110">
                    {f.icon}
                  </span>
                  <h3 className="font-semibold text-brand-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">Cómo funciona</h2>
            <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-muted">
              Flujo operativo para que cada módulo se entienda claramente: acceso, gestión de tickets y
              automatización.
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.step} className="relative text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white shadow-lg shadow-brand-600/30">
                    {s.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-brand-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="bg-surface px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-brand-900">
              Pensado para cada rol
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-muted">
              Cada perfil ve solo la información que necesita y entiende su responsabilidad dentro del proceso.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {roles.map((r) => (
                <div
                  key={r.name}
                  className="rounded-2xl border border-brand-200 bg-gradient-to-b from-brand-50 to-surface p-6"
                >
                  <h3 className="text-lg font-semibold text-brand-800">{r.name}</h3>
                  <p className="mt-2 text-sm text-muted">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-10 sm:px-6">
          <div className="mx-auto mt-5 max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#23436f] to-[#0f2744] px-8 py-14 text-center text-white shadow-2xl shadow-slate-900/35">
            <h2 className="text-2xl font-bold sm:text-3xl">¿Listo para empezar?</h2>
            <p className="mx-auto mt-3 max-w-lg text-blue-100">
              Accede con tu cuenta o regístrate para reportar tu primer ticket en minutos.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <ButtonLink
                href="/login"
                variant="outline"
                className="min-w-[160px] border-blue-100 text-white hover:bg-white/15"
              >
                Iniciar sesión
              </ButtonLink>
              <ButtonLink
                href="/register"
                className="min-w-[160px] bg-white text-slate-900 hover:bg-blue-50"
              >
                Registrarse gratis
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
