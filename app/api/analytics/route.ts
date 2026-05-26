import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile, canAccessAnalytics } from '@/src/lib/auth';

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAnalytics(profile.role)) return jsonError('Sin permiso', 403);
  const supabase = await createClient();
  const { data: tickets, error } = await supabase.from('tickets').select('status, priority, created_at');
  if (error) return jsonError(error.message, 500);
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let resolvedCount = 0;
  for (const t of tickets ?? []) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
    if (t.status === 'Resolved') resolvedCount++;
  }
  const total = tickets?.length ?? 0;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return jsonOk({
    total,
    byStatus,
    byPriority,
    openCount: byStatus['Open'] ?? 0,
    resolvedCount,
    resolutionRate: total > 0 ? Math.round((resolvedCount / total) * 100) : 0,
    createdLast7Days: tickets?.filter((t) => new Date(t.created_at) >= sevenDaysAgo).length ?? 0,
  });
}
