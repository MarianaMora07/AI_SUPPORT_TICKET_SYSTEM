-- Tipos de alerta in-app y título legible

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS kind VARCHAR(50) NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS title VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, is_read, created_at DESC);
