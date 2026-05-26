import { redirect } from 'next/navigation';
import { AdminUsersPanel } from '@/src/components/admin/AdminUsersPanel';
import { N8nTestPanel } from '@/src/components/admin/N8nTestPanel';
import { DailyReportPanel } from '@/src/components/admin/DailyReportPanel';
import { getSessionProfile, canAccessAdmin } from '@/src/lib/auth';

export default async function AdminUsersPage() {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAdmin(profile.role)) redirect('/dashboard');
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Administración</h1>
      <div className="mb-8 space-y-8">
        <N8nTestPanel />
        <DailyReportPanel />
      </div>
      <AdminUsersPanel />
    </div>
  );
}
