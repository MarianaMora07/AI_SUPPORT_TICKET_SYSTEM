import { z } from 'zod';
import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile } from '@/src/lib/auth';
import { triggerN8nWebhook } from '@/src/lib/n8n';
import { recordTicketCreatedNotifications } from '@/src/services/notificationService';
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
  const supabase = await createClient();
  let query = supabase.from('tickets').select('*, categories(id, name)').order('created_at', { ascending: false });
  if (profile.role === 'User') query = query.eq('user_id', profile.id);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return jsonOk(sortTicketsByPriority(data as Ticket[]));
}

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401, 'UNAUTHORIZED');
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      category_id: parsed.data.category_id,
      user_id: profile.id,
      status: 'Open',
      priority: 'Medium',
    })
    .select('*, categories(name)')
    .single();
  if (error) return jsonError(error.message, 500);
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
