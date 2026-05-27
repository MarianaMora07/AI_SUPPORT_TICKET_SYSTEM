import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from '@/src/components/analytics/AnalyticsDashboard';
import { getSessionProfile, canAccessAnalytics } from '@/src/lib/auth';

export default async function AnalyticsPage() {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAnalytics(profile.role)) redirect('/dashboard');
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-900">Métricas</h1>
      <p className="mb-8 text-sm text-muted">Performance del soporte (US-08)</p>
      <AnalyticsDashboard />
    </div>
  );
}
