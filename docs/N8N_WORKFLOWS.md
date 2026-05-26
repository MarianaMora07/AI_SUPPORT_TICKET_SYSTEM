# n8n Cloud — workflows

## Reglas comunes

1. Nodo **Webhook** → método **POST** (salvo reporte diario, ver abajo).
2. Workflow **Active** (interruptor verde).
3. Copiar **Production URL** (`/webhook/…`, no `/webhook-test/`).
4. Reiniciar la app tras cambiar `.env.local` o variables en Vercel.
5. Admin → `/admin/users` → **Probar webhooks** y **Vista previa del reporte**.

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `N8N_WEBHOOK_TICKET_CREATED` | Email al crear ticket |
| `N8N_WEBHOOK_HIGH_PRIORITY` | Slack / alerta prioridad alta |
| `N8N_WEBHOOK_SECRET` | Header `X-Webhook-Secret` en POST salientes |
| `N8N_CRON_SECRET` | Header `X-Cron-Secret` en GET reporte diario |
| `NEXT_PUBLIC_APP_URL` | Base URL de la app (prod) |

Si no defines `N8N_CRON_SECRET`, puedes reutilizar `N8N_WEBHOOK_SECRET`.

---

## 1. Email al crear ticket

- **Trigger:** Webhook POST desde `POST /api/tickets`.
- **Payload:** `event`, `ticketId`, `title`, `userEmail`, `status`, etc.
- **Acción:** enviar email de confirmación al usuario.

---

## 2. Slack — prioridad alta

- **Trigger:** Webhook POST cuando prioridad pasa a High o IA devuelve `riskLevel: high`.
- **Payload:** `event: ticket.high_priority`, `priority`, `riskLevel`, datos del ticket.
- **Acción:** mensaje en canal Slack.

---

## 3. Reporte diario al manager (cron)

La app expone métricas agregadas para que n8n las envíe por email/Slack.

### Endpoint

```
GET https://TU_APP.vercel.app/api/reports/daily
Header: X-Cron-Secret: <valor de N8N_CRON_SECRET>
```

Respuesta JSON (ejemplo):

```json
{
  "event": "daily_report",
  "reportDate": "2026-05-24",
  "total": 12,
  "openCount": 5,
  "summaryText": "Reporte diario — ...",
  "byStatus": { "Open": 5, "Resolved": 7 }
}
```

Usa `summaryText` en el cuerpo del email o el nodo de Slack.

### Workflow en n8n

1. **Schedule Trigger** — cron diario (ej. 08:00).
2. **HTTP Request**
   - Method: **GET**
   - URL: `https://TU_APP.vercel.app/api/reports/daily`
   - Header: `X-Cron-Secret` = mismo valor que en Vercel / `.env.local`
3. **Email** o **Slack** — cuerpo con `{{ $json.summaryText }}` (o campos individuales).
4. Activar workflow.

### Probar sin esperar al cron

1. En la app (Admin): `/admin/users` → **Vista previa del reporte** (valida datos y secreto).
2. En n8n: **Execute workflow** manualmente.
3. Revisar **Executions** y la bandeja del manager.

### Errores frecuentes

| Error | Causa |
|-------|--------|
| 401 | `X-Cron-Secret` incorrecto o no definido en Vercel |
| 500 | Falta `SUPABASE_SERVICE_ROLE_KEY` en el entorno de la app |
| URL vacía en preview | Falta `NEXT_PUBLIC_APP_URL` en producción |
