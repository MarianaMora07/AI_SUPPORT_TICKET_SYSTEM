import { createAdminClient } from '@/src/lib/supabase/admin';
import { computeSlaDeadline, DEFAULT_CATEGORY_SLA_DAYS } from '@/src/lib/sla';

export async function applySlaToTicket(ticketId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: ticket, error } = await admin
    .from('tickets')
    .select('id, created_at, ai_risk_level, category_id, categories(resolution_sla_days)')
    .eq('id', ticketId)
    .single();

  if (error || !ticket) return null;

  const categoryRow = ticket.categories as { resolution_sla_days?: number } | null;
  const categoryDays = categoryRow?.resolution_sla_days ?? DEFAULT_CATEGORY_SLA_DAYS;
  const slaDeadline = computeSlaDeadline(ticket.created_at, categoryDays, ticket.ai_risk_level);

  await admin.from('tickets').update({ sla_deadline: slaDeadline }).eq('id', ticketId);
  return slaDeadline;
}
