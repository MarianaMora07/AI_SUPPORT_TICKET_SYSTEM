import { jsonError, jsonOk } from '@/src/lib/api-response';
import { isValidCronSecret } from '@/src/lib/cron-auth';
import { buildDailyReport } from '@/src/services/reportService';

/**
 * GET — datos agregados para el workflow cron de n8n (reporte diario al manager).
 * Autenticación: header X-Cron-Secret o X-Webhook-Secret (mismo valor que N8N_CRON_SECRET / N8N_WEBHOOK_SECRET).
 */
export async function GET(request: Request) {
  if (!isValidCronSecret(request)) {
    return jsonError('No autorizado', 401, 'UNAUTHORIZED');
  }

  try {
    const report = await buildDailyReport();
    return jsonOk({ event: 'daily_report', ...report });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar reporte';
    return jsonError(message, 500);
  }
}
