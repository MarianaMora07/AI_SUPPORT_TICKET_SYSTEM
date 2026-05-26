import { getSessionProfile, canAccessAdmin } from '@/src/lib/auth';
import { jsonError, jsonOk } from '@/src/lib/api-response';
import { getAppBaseUrl } from '@/src/lib/app-url';
import { buildDailyReport } from '@/src/services/reportService';

/** Vista previa del JSON que consume el cron n8n (solo Admin). */
export async function GET() {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAdmin(profile.role)) {
    return jsonError('Solo administradores', 403);
  }

  try {
    const report = await buildDailyReport();
    const cronConfigured = !!(
      process.env.N8N_CRON_SECRET?.trim() || process.env.N8N_WEBHOOK_SECRET?.trim()
    );
    const base = getAppBaseUrl();

    return jsonOk({
      report,
      cronConfigured,
      dailyReportUrl: base ? `${base}/api/reports/daily` : null,
      hint: cronConfigured
        ? 'En n8n usa HTTP Request GET con header X-Cron-Secret.'
        : 'Define N8N_CRON_SECRET (o N8N_WEBHOOK_SECRET) en el entorno.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar reporte';
    return jsonError(message, 500);
  }
}
