ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS ai_sentiment VARCHAR(32);
