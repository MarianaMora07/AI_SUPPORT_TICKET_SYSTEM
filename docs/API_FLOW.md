# Flujo API

| Ruta | Uso |
|------|-----|
| POST /api/auth/register | Registro con service role |
| POST /api/auth/ensure-profile | Crear fila en users |
| GET/POST /api/tickets | Lista / crear (+ n8n) |
| POST /api/ai/analyze | Análisis IA |
| POST /api/admin/n8n-test | Probar webhooks |
| GET /api/reports/daily | Reporte diario (cron n8n, `X-Cron-Secret`) |
| GET /api/admin/daily-report-preview | Vista previa reporte (Admin) |
