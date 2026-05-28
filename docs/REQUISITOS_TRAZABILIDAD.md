# Trazabilidad de requisitos — AI Support Ticket System

Documento de referencia que mapea cada requisito del PDF base  
(`AI_SUPPORT_TICKET_SYSTEM_REQUISITOS_OBJETIVOS.pdf`) contra la implementación en `ticket_system_mora`.

**Última actualización:** 2026-05-28

---

## Leyenda de estado

| Estado | Significado |
|--------|-------------|
| ✅ | Cumplido en código y/o documentación del repo |
| ⚠️ | Cumplido con adaptación técnica respecto al PDF |
| 🔧 | Depende de configuración externa (Supabase, Vercel, n8n) |
| ❌ | No implementado como entidad dedicada en el sistema |

---

## A. Objetivo principal y alcance

| ID | Requisito (PDF) | Estado | Implementación | Ubicación |
|----|-----------------|--------|----------------|-----------|
| A.1 | Plataforma de soporte **inteligente** (no tickets estáticos) | ✅ | Tickets + IA + priorización + automatización n8n | Proyecto completo |
| A.2 | Gestión operativa clásica + IA para reducir tiempo de lectura, priorización y respuesta | ✅ | Cola priorizada, resumen/sugerencias IA, comentarios, estados | `TicketList`, `TicketDetail`, `aiService` |
| A.3 | Automatización para acelerar reacción del equipo | ✅ | Webhooks n8n + notificaciones in-app | `src/lib/n8n.ts`, `src/services/notificationService.ts` |

---

## B. Frontend (capa de presentación)

| ID | Requisito (PDF) | Estado | Implementación | Ubicación |
|----|-----------------|--------|----------------|-----------|
| B.1 | Vista de **login** | ✅ | Página de inicio de sesión | `app/(auth)/login/page.tsx`, `src/components/auth/AuthForm.tsx` |
| B.2 | Vista de **register** | ✅ | Registro de usuarios | `app/(auth)/register/page.tsx`, `POST /api/auth/register` |
| B.3 | **Dashboard** centralizado | ✅ | Panel con resumen y accesos | `app/(dashboard)/dashboard/page.tsx` |
| B.4 | Visualizar tickets según estado | ✅ | Lista con badges; detalle con estado | `app/(dashboard)/tickets/page.tsx`, `src/components/tickets/TicketList.tsx` |
| B.5 | Pantalla **crear ticket** | ✅ | Formulario con validación | `app/(dashboard)/tickets/new/page.tsx`, `src/components/tickets/NewTicketForm.tsx` |
| B.6 | Pantalla **detalle del ticket** | ✅ | Vista completa + comentarios + IA | `app/(dashboard)/tickets/[id]/page.tsx`, `src/components/tickets/TicketDetail.tsx` |
| B.7 | Estado **Open** | ✅ | Enum + UI + valor por defecto al crear | `supabase/schema.sql`, `TicketDetail.tsx` |
| B.8 | Estado **In Progress** | ✅ | Selector para Agent/Admin | `TicketDetail.tsx`, `PATCH /api/tickets/[id]` |
| B.9 | Estado **Resolved** | ✅ | Selector para Agent/Admin | Idem |
| B.10 | Sección **analítica** / indicadores operativos | ✅ | Dashboard de métricas | `app/(dashboard)/analytics/page.tsx`, `src/components/analytics/AnalyticsDashboard.tsx` |

---

## C. Backend y base de datos

| ID | Requisito (PDF) | Estado | Implementación | Ubicación |
|----|-----------------|--------|----------------|-----------|
| C.1 | CRUD completo de tickets | ✅ | GET/POST listado; GET/PATCH por id; comentarios | `app/api/tickets/*`, `app/api/ticket-comments/*` |
| C.2 | Autenticación basada en **tokens JWT** | ⚠️ | **Supabase Auth** (JWT en cookies/sesión SSR), no módulo JWT custom | `middleware.ts`, `@supabase/ssr`, `src/lib/supabase/*` |
| C.3 | Manejo estricto de **roles** | ✅ | Helpers + APIs + RLS | `src/lib/auth.ts`, `supabase/migrations/002_rls_policies.sql` |
| C.4 | Rol **Admin** | ✅ | Enum + políticas + pantalla admin | `schema.sql`, `src/components/admin/AdminUsersPanel.tsx` |
| C.5 | Rol **Agent** | ✅ | Enum + permisos extendidos | `canAccessAgent()`, RLS |
| C.6 | Rol **User** | ✅ | Default en registro; vista restringida | Trigger `handle_new_user`, filtros en `GET /api/tickets` |
| C.7 | Tabla **users** | ✅ | Perfil ligado a `auth.users` | `supabase/schema.sql` |
| C.8 | Tabla **tickets** | ✅ | Incidentes con campos `ai_*` | `supabase/schema.sql` |
| C.9 | Tabla **comments** | ✅ | Historial con `is_internal` | `supabase/schema.sql`, APIs de comentarios |
| C.10 | Tabla **categories** | ✅ | Clasificación de problemas | `supabase/schema.sql`, `GET /api/categories` |
| C.11 | Tabla **notifications** | ✅ | Alertas in-app | `supabase/schema.sql`, `src/services/notificationService.ts` |
| C.12 | Trazabilidad de llamadas IA | ✅ | Tabla **`ai_logs`** (extensión al mínimo del PDF) | `supabase/schema.sql`, `POST /api/ai/analyze` |
| C.13 | PostgreSQL en **Supabase** | ✅ | Esquema + migraciones RLS | `supabase/` |

---

## D. User stories

| ID | User story (PDF) | Estado | Implementación | Ubicación |
|----|------------------|--------|----------------|-----------|
| US-01 | User: crear ticket de soporte | ✅ | Formulario + `POST /api/tickets` | `NewTicketForm.tsx`, `app/api/tickets/route.ts` |
| US-02 | User: consultar estado en tiempo real | ✅ | Lista/detalle; actualización periódica | `TicketDetail.tsx` (interval 15s), `/tickets` |
| US-03 | Admin: asignar/modificar roles | ✅ | Panel admin + `PATCH /api/admin/users` | `AdminUsersPanel.tsx` |
| US-04 | Agent: tickets ordenados por prioridad | ✅ | Orden `Urgent → Low` en GET | `app/api/tickets/route.ts` (`PRIORITY_ORDER`) |
| US-05 | Agent: sugerencia de respuesta por IA | ✅ | `ai_suggestions` + borrador editable | `POST /api/ai/analyze`, `TicketDetail.tsx` |
| US-06 | Agent: resumen de incidencias largas | ✅ | `ai_summary` en ticket y panel | `aiService.ts`, columnas `ai_*` en `tickets` |
| US-07 | Soporte: alertas automáticas prioridad alta | ✅ | Webhook n8n + notificaciones | `src/lib/n8n.ts`, `PATCH /api/tickets/[id]`, `POST /api/ai/analyze` |
| US-08 | Manager: métricas / evaluar performance | ⚠️ | Sin rol **Manager** en BD; métricas para Agent/Admin + reporte cron n8n | `/analytics`, `GET /api/reports/daily` |

---

## E. Integración de IA (Claude/OpenAI según PDF)

| ID | Requisito (PDF) | Estado | Implementación | Ubicación |
|----|-----------------|--------|----------------|-----------|
| E.1 | IA integrada en **backend** (paso estructurado, no chat suelto) | ✅ | Route Handler dedicado | `app/api/ai/analyze/route.ts` |
| E.2 | **Normalizar entrada** antes de invocar API | ✅ | Título, descripción, categoría y comentarios en un prompt | `buildPrompt()` en `src/services/aiService.ts` |
| E.3 | Salida **solo JSON** (no texto libre) | ✅ | `response_format` / `responseMimeType` + validación Zod | `aiService.ts`, `src/types/ai.ts` |
| E.4 | Llave **`summary`** | ✅ | Validada y persistida | `aiAnalysisSchema`, columna `ai_summary` |
| E.5 | Llave **`classification`** | ✅ | Idem | `ai_classification` |
| E.6 | Llave **`suggestions`** | ✅ | String (no array) | `ai_suggestions` |
| E.7 | Llave **`riskLevel`** | ✅ | `low` \| `medium` \| `high` | `ai_risk_level` |
| E.8 | Clasificar **prioridad** del ticket | ✅ | Flag `applyPriority` + `mapRiskToPriority()` | `app/api/ai/analyze/route.ts` |
| E.9 | Clasificar **sentimiento** del usuario | ✅ | Campo `sentiment` (extensión) | `src/types/ai.ts`, `ai_sentiment` |
| E.10 | Resumir problemática central | ✅ | Campo `summary` | Prompt + UI |
| E.11 | Redactar **propuesta de respuesta inicial** | ✅ | Campo `suggestions` | Panel IA en `TicketDetail.tsx` |
| E.12 | Detectar **riesgo de escalamiento** | ✅ | `riskLevel` + alertas si `high` | `ai/analyze`, webhooks n8n |
| E.13 | Recomendar **siguiente acción** (asignar, escalar, cerrar, pedir datos) | ✅ | `recommendedAction` en schema JSON | `src/types/ai.ts` |
| E.14 | **Human-in-the-loop** en acciones críticas | ✅ | IA no publica sola; aprobación manual del agente | Botón «Aprobar y publicar como comentario» |
| E.15 | Resultado IA puede **disparar flujos n8n** | ✅ | Webhook alta prioridad tras análisis/riesgo | `app/api/ai/analyze/route.ts` |
| E.16 | **Trazabilidad**: prompt, modelo, latencia, resultado | ✅ | `INSERT` en `ai_logs` | `app/api/ai/analyze/route.ts` |
| E.17 | Usar **Claude/OpenAI** como proveedor | ⚠️ | **Gemini por defecto**; OpenAI y Anthropic opcionales + fallback | `AI_PROVIDER`, `src/services/aiService.ts` |

---

## F. Automatizaciones n8n

| ID | Requisito (PDF) | Estado | Implementación | Ubicación |
|----|-----------------|--------|----------------|-----------|
| F.1 | Al insertar ticket → **email de confirmación** | ✅ | Webhook inmediato tras insert en API | `POST /api/tickets` → `N8N_WEBHOOK_TICKET_CREATED` |
| F.2 | Prioridad **alta** → alerta **Slack** inmediata | ✅ | Webhook si High/Urgent o `riskLevel: high` | `src/lib/n8n.ts`, `PATCH` ticket, `POST /api/ai/analyze` |
| F.3 | Flujo **programado** → resumen diario al manager | ✅ | Cron n8n → `GET /api/reports/daily` | `src/services/reportService.ts`, `docs/N8N_WORKFLOWS.md` |
| F.4 | Eventos disparados desde lógica de negocio | ✅ | API orquesta webhooks (no solo trigger de BD) | `triggerN8nWebhook()` |
| F.5 | Manejo de **errores y reintentos** en n8n | 🔧 | Configuración en workflows n8n; app registra fallos | `src/lib/n8n.ts`, `docs/N8N_WORKFLOWS.md` |
| F.6 | Secreto compartido en webhooks/cron | ✅ | Headers `X-Webhook-Secret` / `X-Cron-Secret` | `src/lib/n8n.ts`, `src/lib/cron-auth.ts` |

---

## G. Despliegue e integración end-to-end

| ID | Requisito (PDF) | Estado | Implementación | Ubicación |
|----|-----------------|--------|----------------|-----------|
| G.1 | **Frontend en Vercel** | 🔧 | Documentado; deploy en cuenta del equipo | `docs/VERCEL_DEPLOY.md` |
| G.2 | **Base de datos en Supabase** | 🔧 | Esquema listo; requiere proyecto Supabase activo | `supabase/schema.sql` |
| G.3 | Sistema **integrado** punta a punta antes de presentación | 🔧 | Código ~98%; ver `PROJECT_PHASES.md` | `PROJECT_PHASES.md` |
| G.4 | Variables de entorno en producción | 🔧 | Lista documentada | `docs/VERCEL_DEPLOY.md`, `.env.example` |

---

## H. Criterios de aceptación (AC)

| ID | Criterio (PDF) | Estado | Cómo se cumple | Evidencia |
|----|----------------|--------|----------------|-----------|
| AC 1.1 | Formulario valida título, descripción y categoría no vacíos | ✅ | Zod en API + validación en formulario | `app/api/tickets/route.ts`, `NewTicketForm.tsx` |
| AC 1.2 | Estado inicial del ticket = **Open** | ✅ | `status: 'Open'` en insert | `POST /api/tickets` |
| AC 1.3 | Inserción dispara webhook n8n para email | ✅ | `triggerN8nWebhook` inmediato tras insert | `app/api/tickets/route.ts` |
| AC 2.1 | Normalizar ticket + comentarios antes de IA | ✅ | `analyzeTicket({ title, description, categoryName, comments })` | `app/api/ai/analyze/route.ts` |
| AC 2.2 | Validar JSON con llaves exactas del PDF | ✅ | Zod: `summary`, `classification`, `suggestions`, `riskLevel` (+ extras) | `src/types/ai.ts` |
| AC 2.3 | Auditoría: prompt, modelo, latencia, resultado | ✅ | Tabla `ai_logs` | `app/api/ai/analyze/route.ts` |
| AC 3.1 | n8n evalúa `riskLevel` o prioridad alta → Slack | ✅ | Payload con `riskLevel` y `priority`; workflow n8n ramifica | `src/lib/n8n.ts`, `docs/N8N_WORKFLOWS.md` |
| AC 3.2 | Nodos de error/reintentos en flujo n8n | 🔧 | Responsabilidad del workflow en n8n Cloud | `docs/N8N_WORKFLOWS.md` |

---

## I. Seguridad y control de acceso

| ID | Requisito (PDF) | Estado | Implementación | Ubicación |
|----|-----------------|--------|----------------|-----------|
| I.1 | Discriminar acciones por rol en backend | ✅ | `getSessionProfile` + `canAccess*` en APIs | `src/lib/auth.ts` |
| I.2 | User solo ve sus tickets | ✅ | Filtro API + RLS | `GET /api/tickets`, política `tickets_select_own` |
| I.3 | Agent ve cola completa | ✅ | Sin filtro `user_id` + RLS | `GET /api/tickets` |
| I.4 | Admin gestiona roles | ✅ | Solo `canAccessAdmin` | `app/api/admin/users/route.ts` |
| I.5 | Comentarios internos ocultos al User | ✅ | RLS + `is_internal` + UI | `002_rls_policies.sql`, `TicketDetail.tsx` |
| I.6 | Rutas protegidas sin sesión | ✅ | Middleware redirige a `/login` | `src/lib/supabase/middleware.ts` |
| I.7 | IA solo para Agent/Admin | ✅ | HTTP 403 en API; panel oculto en UI | `app/api/ai/analyze/route.ts`, `TicketDetail.tsx` |

**Capas de seguridad:** UI → API Next.js → RLS Supabase. Detalle en `docs/ROLES_Y_FLUJOS.md` §8.

---

## J. Utilidades de IA textuales (lista del PDF)

| ID | Utilidad (PDF) | Estado | Campo / acción | Ubicación |
|----|----------------|--------|----------------|-----------|
| J.1 | Clasificar prioridad | ✅ | `applyPriority` + `mapRiskToPriority()` | `src/services/aiService.ts` |
| J.2 | Clasificar sentimiento | ✅ | `sentiment` | `src/types/ai.ts` |
| J.3 | Resumir problema | ✅ | `summary` | Prompt + `ai_summary` |
| J.4 | Sugerir respuesta inicial | ✅ | `suggestions` | Prompt + UI editable |
| J.5 | Detectar riesgo de escalamiento | ✅ | `riskLevel` | Prompt + alertas |
| J.6 | Recomendar acción siguiente | ✅ | `recommendedAction` | Schema Zod (opcional en respuesta) |

---

## K. Priorización del backlog (PDF)

| ID | Prioridad PDF | Contenido | Estado |
|----|---------------|-----------|--------|
| K.1 | **Alta** | US-01, US-02, US-03 (CRUD + accesos) | ✅ |
| K.2 | **Media** | US-04 a US-07 (IA + n8n) | ✅ |
| K.3 | **Baja** | US-08 (analítica / manager) | ⚠️ |

---

## Resumen numérico

| Estado | Aprox. |
|--------|--------|
| ✅ Cumplido | 55 |
| ⚠️ Con adaptación | 5 |
| 🔧 Configuración externa | 6 |
| ❌ No implementado | 1 |

---

## Adaptaciones respecto al PDF (defensa del proyecto)

| Tema en PDF | Implementación en el proyecto |
|-------------|-------------------------------|
| JWT explícito en backend custom | Supabase Auth + cookies SSR (`@supabase/ssr`) |
| Claude / OpenAI obligatorio | Gemini por defecto (`AI_PROVIDER=gemini`); OpenAI y Anthropic como alternativa/fallback |
| Rol **Manager** con login propio | No existe; métricas en `/analytics` (Agent/Admin) y reporte diario vía cron n8n |
| Webhook al insertar vía trigger de BD | Webhook disparado desde `POST /api/tickets` tras el insert (mismo efecto AC 1.3) |
| JSON IA con 4 llaves exactas | Cumplido + campos `sentiment` y `recommendedAction` |

---

## Documentación relacionada

| Documento | Contenido |
|-----------|-----------|
| [ROLES_Y_FLUJOS.md](./ROLES_Y_FLUJOS.md) | Matriz de permisos y flujos por rol |
| [N8N_WORKFLOWS.md](./N8N_WORKFLOWS.md) | Tres workflows n8n |
| [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | Despliegue en producción |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Resumen de capas |
| [API_FLOW.md](./API_FLOW.md) | Flujo API resumido |
| [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) | Guión de demo E2E |
| [../PROJECT_PHASES.md](../PROJECT_PHASES.md) | Estado de fases y user stories |

---

*Generado para entrega y revisión académica/profesional del proyecto ticket_system_mora.*
