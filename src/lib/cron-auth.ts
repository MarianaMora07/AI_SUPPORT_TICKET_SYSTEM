/** Valida llamadas del cron n8n al endpoint de reporte diario. */
export function isValidCronSecret(request: Request): boolean {
  const secret =
    process.env.N8N_CRON_SECRET?.trim() || process.env.N8N_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const header =
    request.headers.get('x-cron-secret') ??
    request.headers.get('x-webhook-secret') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  return header === secret;
}
