import { z } from 'zod';
import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile, canAccessAgent } from '@/src/lib/auth';
import { triggerN8nWebhook } from '@/src/lib/n8n';

const updateSchema = z.object({
  status: z.enum(['Open', 'In Progress', 'Resolved']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  ai_summary: z.string().optional(),
  ai_classification: z.string().optional(),
  ai_suggestions: z.string().optional(),
  ai_risk_level: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401);
  const supabase = await createClient();
  const { data, error } = await supabase.from('tickets').select('*, categories(id, name)').eq('id', id).single();
  if (error || !data) return jsonError('Ticket no encontrado', 404);
  return jsonOk(data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401);
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError('Datos inválidos', 400);
  const supabase = await createClient();
  const { data: existing } = await supabase.from('tickets').select('*').eq('id', id).single();
  if (!existing) return jsonError('Ticket no encontrado', 404);
  const isAgent = canAccessAgent(profile.role);
  if (!isAgent && existing.user_id !== profile.id) return jsonError('Sin permiso', 403);
  const { data, error } = await supabase.from('tickets').update(parsed.data).eq('id', id).select('*').single();
  if (error) return jsonError(error.message, 500);
  const priority = parsed.data.priority ?? data.priority;
  const risk = parsed.data.ai_risk_level ?? data.ai_risk_level;
  if (priority === 'High' || priority === 'Urgent' || risk === 'high') {
    await triggerN8nWebhook('N8N_WEBHOOK_HIGH_PRIORITY', {
      event: 'ticket.high_priority',
      ticketId: id,
      title: data.title,
      priority,
      riskLevel: risk,
    });
  }
  return jsonOk(data);
}
