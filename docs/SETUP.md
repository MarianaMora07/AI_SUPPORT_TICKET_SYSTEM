# Setup

1. Supabase: ejecutar `supabase/migrations/002_rls_policies.sql` y `003_fix_signup_trigger.sql`
2. `.env.local`: URL, anon key, **service_role**, IA, webhooks n8n
3. `npm run dev` — usar siempre la misma URL (localhost o IP de red)
4. n8n: workflow **Active** + **Production URL** (no `/webhook-test/`)

## Registro / login

Requiere `SUPABASE_SERVICE_ROLE_KEY`. Si falta perfil en `users`, irás a `/auth/setup`.

## n8n 404

Mensaje típico: `webhook "POST ticket-created" is not registered` → activa el workflow en n8n.

## IA región bloqueada

`AI_PROVIDER=anthropic` y `ANTHROPIC_API_KEY` en `.env.local`.
