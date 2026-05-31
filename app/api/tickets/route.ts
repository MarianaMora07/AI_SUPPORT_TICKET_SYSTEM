import { z } from 'zod';
import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile } from '@/src/lib/auth';
import { triggerN8nWebhook } from '@/src/lib/n8n';
import { log } from '@/src/lib/logger';
import { computeSlaDeadline, DEFAULT_CATEGORY_SLA_DAYS } from '@/src/lib/sla';
import { recordTicketCreatedNotifications } from '@/src/services/notificationService';
import { autoAssignPriority } from '@/src/services/ticketAiService';
import type { Ticket } from '@/src/types/database';
import { sortTicketsByPriority } from '@/src/lib/ticket-sort';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category_id: z.string().uuid(),
});

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401, 'UNAUTHORIZED');
  const status = new URL(request.url).searchParams.get('status');
  const slaStatus = new URL(request.url).searchParams.get('slaStatus');
  const supabase = await createClient();
  let query = supabase
    .from('tickets')
    .select('*, categories(id, name, resolution_sla_days)')
    .order('created_at', { ascending: false });
  if (profile.role === 'User') query = query.eq('user_id', profile.id);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);

  let tickets = sortTicketsByPriority(data as Ticket[]);

  if (slaStatus) {
    const { getSlaStatus } = await import('@/src/lib/sla');
    tickets = tickets.filter((t) => getSlaStatus(t) === slaStatus);
  }

  return jsonOk(tickets);
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401, 'UNAUTHORIZED');
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('resolution_sla_days')
    .eq('id', parsed.data.category_id)
    .single();

  const categoryDays = category?.resolution_sla_days ?? DEFAULT_CATEGORY_SLA_DAYS;
  const createdAt = new Date().toISOString();
  const slaDeadline = computeSlaDeadline(createdAt, categoryDays, null);

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      category_id: parsed.data.category_id,
      user_id: profile.id,
      status: 'Open',
      priority: 'Medium',
      sla_deadline: slaDeadline,
    })
    .select('*, categories(name, resolution_sla_days)')
    .single();
  if (error) return jsonError(error.message, 500);

  void autoAssignPriority(data.id).catch((err) =>
    log('error', 'Auto-priority background failed', {
      ticketId: data.id,
      error: err instanceof Error ? err.message : 'unknown',
    })
  );

  const n8nResult = await triggerN8nWebhook('N8N_WEBHOOK_TICKET_CREATED', {
    event: 'ticket.created',
    ticketId: data.id,
    title: data.title,
    userEmail: profile.email,
    userName: profile.full_name,
    status: data.status,
    createdAt: data.created_at,
  });
  await recordTicketCreatedNotifications({
    ticketId: data.id,
    ticketTitle: data.title,
    ownerId: profile.id,
    event: 'ticket.created',
    n8nResult,
  });
  return jsonOk(data, 201);
}
