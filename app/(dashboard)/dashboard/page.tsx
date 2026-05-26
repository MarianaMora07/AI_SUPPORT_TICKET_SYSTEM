import Link from 'next/link';
import { getSessionProfile } from '@/src/lib/auth';
import { createClient } from '@/src/lib/supabase/server';

export default async function DashboardPage() {
  const profile = await getSessionProfile();
  if (!profile) return null;
  const supabase = await createClient();
  let query = supabase.from('tickets').select('id', { count: 'exact', head: true });
  if (profile.role === 'User') query = query.eq('user_id', profile.id);
  const { count } = await query;
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Hola, {profile.full_name ?? profile.email}</h1>
      <p className="mb-8 text-zinc-600">Rol: <strong>{profile.role}</strong></p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Tickets</p>
          <p className="mt-1 text-3xl font-bold text-indigo-600">{count ?? 0}</p>
        </div>
        <Link href="/tickets" className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-900 dark:bg-indigo-950/50">
          <p className="font-medium text-indigo-900 dark:text-indigo-200">Ver tickets</p>
        </Link>
        {profile.role === 'User' && (
          <Link href="/tickets/new" className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-medium">Nuevo ticket</p>
          </Link>
        )}
      </div>
    </div>
  );
}
