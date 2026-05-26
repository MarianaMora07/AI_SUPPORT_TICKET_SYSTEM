# Deploy en Vercel

## 1. Importar proyecto

1. [vercel.com/new](https://vercel.com/new) → importar el repositorio de GitHub.
2. Framework: **Next.js** (detectado automáticamente).
3. Root directory: raíz del repo.

## 2. Variables de entorno (Production)

Copiar desde `.env.local`:

| Variable | Obligatoria |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí |
| `AI_PROVIDER` | Sí (`gemini`) |
| `GEMINI_API_KEY` | Sí |
| `N8N_WEBHOOK_TICKET_CREATED` | Sí |
| `N8N_WEBHOOK_HIGH_PRIORITY` | Sí |
| `N8N_WEBHOOK_SECRET` | Recomendada |
| `N8N_CRON_SECRET` | Recomendada (reporte diario) |
| `NEXT_PUBLIC_APP_URL` | Sí — URL de producción, ej. `https://tu-app.vercel.app` |

`NEXT_PUBLIC_APP_URL` se usa en la vista previa del reporte y en la documentación de n8n.

## 3. Supabase — URLs de redirección

En **Authentication → URL Configuration**, añadir:

- `https://tu-app.vercel.app/**`
- Site URL: `https://tu-app.vercel.app`

## 4. Deploy

Tras el primer deploy, anotar la URL y actualizar `NEXT_PUBLIC_APP_URL` si hace falta → **Redeploy**.

## 5. Smoke test en producción

1. Registro e inicio de sesión.
2. Crear ticket → email n8n.
3. Análisis IA en detalle del ticket.
4. Prioridad alta → Slack n8n.
5. `/analytics` como Agent/Admin.
6. Admin → **Vista previa del reporte** y cron n8n (ver [N8N_WORKFLOWS.md](./N8N_WORKFLOWS.md)).

## 6. CLI (opcional)

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.vercel.local
npx vercel --prod
```

## Demo

Seguir [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) con la URL pública de Vercel.
