# AI Support Ticket System

Next.js 16 · Supabase · Google Gemini · n8n · Vercel

## Inicio rápido

```bash
npm install
cp .env.example .env.local
# Completa Supabase, GEMINI_API_KEY, webhooks n8n, N8N_CRON_SECRET
npm run dev
```

Documentación:

- [docs/SETUP.md](docs/SETUP.md) — entorno local
- [docs/N8N_WORKFLOWS.md](docs/N8N_WORKFLOWS.md) — email, Slack, reporte diario
- [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md) — producción
- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) — demo final
- [PROJECT_PHASES.md](PROJECT_PHASES.md) — seguimiento de fases

## API relevante

| Ruta | Descripción |
|------|-------------|
| `POST /api/tickets` | Crear ticket (+ webhook email) |
| `POST /api/ai/analyze` | Análisis Gemini |
| `GET /api/reports/daily` | Métricas para cron n8n (`X-Cron-Secret`) |

## Admin

`/admin/users` — gestión de usuarios, prueba de webhooks n8n y vista previa del reporte diario.
