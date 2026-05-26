import { redirect } from 'next/navigation';
import { DashboardNav } from '@/src/components/layout/DashboardNav';
import { getSessionProfile } from '@/src/lib/auth';
import { createClient } from '@/src/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await getSessionProfile();
  if (!profile) redirect('/auth/setup');

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <DashboardNav role={profile.role} fullName={profile.full_name} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
