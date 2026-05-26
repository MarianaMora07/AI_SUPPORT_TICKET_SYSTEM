import { createAdminClient } from '@/src/lib/supabase/admin';

export type DailyReportPayload = {
  reportDate: string;
  generatedAt: string;
  total: number;
  openCount: number;
  resolvedCount: number;
  resolutionRate: number;
  highPriorityOpen: number;
  createdLast24Hours: number;
  createdLast7Days: number;
  aiAnalyzedCount: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  summaryText: string;
};

export async function buildDailyReport(): Promise<DailyReportPayload> {
  const supabase = createAdminClient();
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('status, priority, created_at, ai_summary');

  if (error) throw new Error(error.message);

  const rows = tickets ?? [];
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let resolvedCount = 0;
  let highPriorityOpen = 0;
  let aiAnalyzedCount = 0;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * dayMs;

  for (const t of rows) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
    if (t.status === 'Resolved') resolvedCount++;
    if (t.status === 'Open' && t.priority === 'High') highPriorityOpen++;
    if (t.ai_summary) aiAnalyzedCount++;
  }

  const total = rows.length;
  const createdLast24Hours = rows.filter(
    (t) => now - new Date(t.created_at).getTime() < dayMs
  ).length;
  const createdLast7Days = rows.filter(
    (t) => new Date(t.created_at).getTime() >= sevenDaysAgo
  ).length;
  const openCount = byStatus['Open'] ?? 0;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
  const reportDate = new Date().toISOString().slice(0, 10);

  const summaryText = [
    `Reporte diario — ${reportDate}`,
    `Total tickets: ${total}`,
    `Abiertos: ${openCount} · Resueltos: ${resolvedCount} (${resolutionRate}%)`,
    `Alta prioridad abiertos: ${highPriorityOpen}`,
    `Nuevos (24h): ${createdLast24Hours} · Nuevos (7d): ${createdLast7Days}`,
    `Con análisis IA: ${aiAnalyzedCount}`,
    `Por estado: ${Object.entries(byStatus)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ') || '—'}`,
    `Por prioridad: ${Object.entries(byPriority)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ') || '—'}`,
  ].join('\n');

  return {
    reportDate,
    generatedAt: new Date().toISOString(),
    total,
    openCount,
    resolvedCount,
    resolutionRate,
    highPriorityOpen,
    createdLast24Hours,
    createdLast7Days,
    aiAnalyzedCount,
    byStatus,
    byPriority,
    summaryText,
  };
}
