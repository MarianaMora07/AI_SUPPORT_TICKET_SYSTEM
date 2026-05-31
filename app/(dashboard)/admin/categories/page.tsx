import { redirect } from 'next/navigation';
import { AdminCategoriesPanel } from '@/src/components/admin/AdminCategoriesPanel';
import { getSessionProfile, canAccessAdmin } from '@/src/lib/auth';

export default async function AdminCategoriesPage() {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAdmin(profile.role)) redirect('/dashboard');

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-900">SLA por categoría</h1>
      <AdminCategoriesPanel />
    </div>
  );
}
