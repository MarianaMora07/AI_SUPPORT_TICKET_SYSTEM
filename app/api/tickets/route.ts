import { z } from 'zod';
import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile } from '@/src/lib/auth';
import { triggerN8nWebhook } from '@/src/lib/n8n';
import type { Ticket, TicketPriority } from '@/src/types/database';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category_id: z.string().uuid(),
});

const PRIORITY_ORDER: Record<TicketPriority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

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
  const sorted = [...(data as Ticket[])].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  return jsonOk(sorted);
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
  await triggerN8nWebhook('N8N_WEBHOOK_TICKET_CREATED', {
    event: 'ticket.created',
    ticketId: data.id,
    title: data.title,
    userEmail: profile.email,
    userName: profile.full_name,
    status: data.status,
    createdAt: data.created_at,
  });
  return jsonOk(data, 201);
}
