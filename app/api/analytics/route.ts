import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile, canAccessAnalytics } from '@/src/lib/auth';
import { getSlaStatus } from '@/src/lib/sla';
import type { Ticket } from '@/src/types/database';

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAnalytics(profile.role)) return jsonError('Sin permiso', 403);
  const supabase = await createClient();
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('status, priority, created_at, sla_deadline, resolved_at, ai_risk_level, category_id, categories(name)');
  if (error) return jsonError(error.message, 500);

  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const bySlaStatus: Record<string, number> = { on_track: 0, warning: 0, breached: 0, met: 0 };
  const byCategory: Record<string, number> = {};
  const byRisk: Record<string, number> = {};
  let resolvedCount = 0;
  let slaMetCount = 0;
  let slaEvaluatedCount = 0;

  for (const t of tickets ?? []) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
    if (t.status === 'Resolved') resolvedCount++;

    const sla = getSlaStatus(t as unknown as Ticket);
    bySlaStatus[sla] = (bySlaStatus[sla] ?? 0) + 1;

    if (t.status === 'Resolved' && t.sla_deadline) {
      slaEvaluatedCount++;
      if (sla === 'met') slaMetCount++;
    }

    const cat = t.categories as { name?: string } | null;
    const catName = cat?.name ?? 'Sin categoría';
    byCategory[catName] = (byCategory[catName] ?? 0) + 1;

    if (t.ai_risk_level) {
      byRisk[t.ai_risk_level] = (byRisk[t.ai_risk_level] ?? 0) + 1;
    }
  }

  const total = tickets?.length ?? 0;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const openBreached = (tickets ?? []).filter(
    (t) => t.status !== 'Resolved' && getSlaStatus(t as unknown as Ticket) === 'breached'
  ).length;
  const openWarning = (tickets ?? []).filter(
    (t) => t.status !== 'Resolved' && getSlaStatus(t as unknown as Ticket) === 'warning'
  ).length;

  return jsonOk({
    total,
    byStatus,
    byPriority,
    bySlaStatus,
    byCategory,
    byRisk,
    openCount: byStatus['Open'] ?? 0,
    resolvedCount,
    resolutionRate: total > 0 ? Math.round((resolvedCount / total) * 100) : 0,
    createdLast7Days: tickets?.filter((t) => new Date(t.created_at) >= sevenDaysAgo).length ?? 0,
    slaComplianceRate:
      slaEvaluatedCount > 0 ? Math.round((slaMetCount / slaEvaluatedCount) * 100) : 0,
    openBreached,
    openWarning,
    slaMetCount,
    slaEvaluatedCount,
  });
}
