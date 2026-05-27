import Link from 'next/link';
import { getSessionProfile } from '@/src/lib/auth';
import { createClient } from '@/src/lib/supabase/server';
import { ButtonLink } from '@/src/components/ui/Button';

export default async function DashboardPage() {
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();
  let query = supabase.from('tickets').select('id', { count: 'exact', head: true });
  if (profile.role === 'User') query = query.eq('user_id', profile.id);
  const { count } = await query;

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
          Hola, {profile.full_name ?? profile.email}
        </h1>
        <p className="mt-1 text-muted">
          Panel de control · Rol: <span className="font-medium text-brand-700">{profile.role}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm shadow-brand-900/5 transition hover:shadow-md">
          <p className="text-sm font-medium text-muted">Tus tickets</p>
          <p className="mt-2 text-4xl font-bold text-brand-600">{count ?? 0}</p>
        </div>

        <Link
          href="/tickets"
          className="group rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
        >
          <p className="font-semibold text-brand-800 group-hover:text-brand-600">Ver tickets →</p>
          <p className="mt-1 text-sm text-muted">Cola y detalle de incidentes</p>
        </Link>

        {profile.role === 'User' && (
          <Link
            href="/tickets/new"
            className="group rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <p className="font-semibold text-brand-800">Nuevo ticket →</p>
            <p className="mt-1 text-sm text-muted">Reportar un incidente</p>
          </Link>
        )}

        {(profile.role === 'Admin' || profile.role === 'Agent') && (
          <Link
            href="/analytics"
            className="group rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <p className="font-semibold text-brand-800">Métricas →</p>
            <p className="mt-1 text-sm text-muted">Resumen y estadísticas</p>
          </Link>
        )}
      </div>

      {profile.role === 'User' && (
        <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-6">
          <p className="text-sm text-muted">
            ¿Necesitas ayuda? Crea un ticket y recibirás confirmación por correo.
          </p>
          <ButtonLink href="/tickets/new" className="mt-4">
            Crear ticket
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
