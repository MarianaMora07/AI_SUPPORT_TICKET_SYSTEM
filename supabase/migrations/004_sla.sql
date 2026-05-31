-- SLA de resolución + timestamps de IA

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS resolution_sla_days INTEGER NOT NULL DEFAULT 14
  CHECK (resolution_sla_days > 0 AND resolution_sla_days <= 90);

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_priority_assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tickets_sla_deadline ON public.tickets (sla_deadline);

-- Backfill: deadline provisional (14 días desde creación si no hay categoría)
UPDATE public.tickets t| 
SET sla_deadline = t.created_at + (
  COALESCE(
    (SELECT c.resolution_sla_days FROM public.categories c WHERE c.id = t.category_id),
    14
  ) || ' days'
)::INTERVAL
WHERE t.sla_deadline IS NULL;

-- Backfill: resolved_at para tickets ya resueltos
UPDATE public.tickets
SET resolved_at = updated_at
WHERE status = 'Resolved'::ticket_status AND resolved_at IS NULL;
