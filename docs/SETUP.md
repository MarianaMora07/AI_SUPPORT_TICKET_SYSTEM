# Setup

1. **Supabase:** ejecutar `supabase/migrations/002_rls_policies.sql` y `003_fix_signup_trigger.sql` en el SQL Editor.
2. **`.env.local`:** copiar desde `.env.example` y completar:
   - Supabase URL, anon key, **service_role**
   - `AI_PROVIDER=gemini` y `GEMINI_API_KEY`
   - Webhooks n8n (`N8N_WEBHOOK_*`)
   - `N8N_CRON_SECRET` (reporte diario)
   - `NEXT_PUBLIC_APP_URL` (opcional en local: `http://localhost:3000`)
3. **`npm install`** y **`npm run dev`** — usar siempre la misma URL (localhost o IP de red).
4. **n8n:** workflows **Active** + **Production URL** (no `/webhook-test/`).

## Registro / login

Requiere `SUPABASE_SERVICE_ROLE_KEY`. Si falta perfil en `users`, la app redirige a `/auth/setup`.

## n8n 404

Mensaje típico: `webhook "POST ticket-created" is not registered` → activar el workflow en n8n.

## IA

Proveedor único: **Google Gemini**. Configura `GEMINI_API_KEY` en [Google AI Studio](https://aistudio.google.com/apikey).

## Producción

Ver [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md).
