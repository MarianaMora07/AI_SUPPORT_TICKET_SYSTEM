# Demo (10–15 min)

Usar la URL de producción (Vercel) tras el deploy.

## Flujo

1. **User:** registrar → crear ticket → comprobar email de confirmación.
2. **Admin:** `/admin/users` — roles, probar webhooks n8n, vista previa reporte diario.
3. **Agent:** cola en `/tickets` → abrir ticket → **Analizar con IA** → editar sugerencia si aplica.
4. **Prioridad alta:** cambiar prioridad a High o IA con riesgo alto → alerta Slack.
5. **Manager:** `/analytics` — totales y tasas.
6. **Reporte diario:** en n8n, ejecutar manualmente el workflow cron → email/Slack al manager.

## Checklist previo

- [ ] RLS aplicado en Supabase
- [ ] Variables en Vercel (Supabase, Gemini, n8n, `N8N_CRON_SECRET`, `NEXT_PUBLIC_APP_URL`)
- [ ] 3 workflows n8n activos (email, Slack, reporte diario)
- [ ] Redirect URLs de Supabase incluyen el dominio Vercel

## Roles de prueba sugeridos

| Rol | Email de prueba |
|-----|-----------------|
| User | usuario demo |
| Agent | agente demo |
| Admin | admin demo |
