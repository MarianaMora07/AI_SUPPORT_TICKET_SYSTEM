-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

CREATE POLICY categories_select ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.get_my_role() = 'Admin');
CREATE POLICY users_select_agents ON public.users FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('Agent', 'Admin'));
CREATE POLICY users_update_role_admin ON public.users FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'Admin') WITH CHECK (public.get_my_role() = 'Admin');

CREATE POLICY tickets_select_own ON public.tickets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY tickets_select_agent ON public.tickets FOR SELECT TO authenticated USING (public.get_my_role() IN ('Agent', 'Admin'));
CREATE POLICY tickets_insert_own ON public.tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY tickets_update_own ON public.tickets FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'Open') WITH CHECK (user_id = auth.uid());
CREATE POLICY tickets_update_agent ON public.tickets FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('Agent', 'Admin')) WITH CHECK (public.get_my_role() IN ('Agent', 'Admin'));

CREATE POLICY comments_select_public ON public.comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid() AND is_internal = false));
CREATE POLICY comments_select_agent ON public.comments FOR SELECT TO authenticated USING (public.get_my_role() IN ('Agent', 'Admin'));
CREATE POLICY comments_insert ON public.comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
    OR public.get_my_role() IN ('Agent', 'Admin')));

CREATE POLICY notifications_own ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY ai_logs_select_agent ON public.ai_logs FOR SELECT TO authenticated USING (public.get_my_role() IN ('Agent', 'Admin'));
CREATE POLICY ai_logs_insert_agent ON public.ai_logs FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('Agent', 'Admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = TIMEZONE('utc', NOW()); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_updated_at ON public.tickets;
CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON public.tickets (status, priority, created_at DESC);
