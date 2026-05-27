import Link from 'next/link';
import { Logo } from '@/src/components/layout/Logo';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="relative hidden w-[44%] overflow-hidden bg-auth-panel lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-16 right-0 h-80 w-80 rounded-full bg-brand-300/40 blur-3xl" />
        </div>
        <div className="relative z-10">
          <Link href="/" className="text-white">
            <span className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-sm font-bold backdrop-blur">
                TS
              </span>
              <span className="text-xl font-bold">TicketSystem</span>
            </span>
          </Link>
        </div>
        <div className="relative z-10 space-y-6 text-white">
          <h2 className="text-3xl font-bold leading-tight">
            Soporte técnico inteligente para tu organización
          </h2>
          <p className="max-w-md text-base leading-relaxed text-blue-100">
            Centraliza incidentes, prioriza con IA y mantén a tu equipo informado con
            notificaciones automáticas.
          </p>
          <ul className="space-y-3 text-sm text-blue-50">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
              Tickets con seguimiento en tiempo real
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
              Análisis y sugerencias con Google Gemini
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
              Alertas por email y Slack vía n8n
            </li>
          </ul>
        </div>
        <p className="relative z-10 text-sm text-blue-200/80">AI Support Ticket System</p>
      </aside>

      <div className="flex flex-1 flex-col bg-mesh">
        <div className="flex items-center justify-between px-4 py-4 lg:hidden">
          <Logo />
          <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            ← Inicio
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md animate-fade-up">
            <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-xl shadow-brand-900/5">
              <h1 className="text-2xl font-bold text-brand-900">{title}</h1>
              <p className="mt-1 mb-6 text-sm text-muted">{subtitle}</p>
              {children}
            </div>
            <p className="mt-6 text-center text-sm text-muted lg:hidden">
              <Link href="/" className="font-medium text-brand-600 hover:text-brand-700">
                Volver al inicio
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
