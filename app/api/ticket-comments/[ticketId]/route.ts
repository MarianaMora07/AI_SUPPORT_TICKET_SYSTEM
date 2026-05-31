import { z } from 'zod';
import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile, canAccessAgent } from '@/src/lib/auth';
import { recordCommentNotifications } from '@/src/services/notificationService';
import type { TicketStatus } from '@/src/types/database';

const commentSchema = z.object({
  message: z.string().min(1),
  is_internal: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401);
  const supabase = await createClient();
  let query = supabase
    .from('comments')
    .select('*, users(full_name, email, role)')
    .eq('ticket_id', ticketId)
    .order('created_at');
  if (!canAccessAgent(profile.role)) query = query.eq('is_internal', false);
  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401);
  const parsed = commentSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError('Mensaje requerido', 400);
  const isInternal = parsed.data.is_internal ?? false;
  if (isInternal && !canAccessAgent(profile.role)) return jsonError('Sin permiso', 403);

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, title, status, user_id')
    .eq('id', ticketId)
    .single();
  if (!ticket) return jsonError('Ticket no encontrado', 404);

  const { data, error } = await supabase
    .from('comments')
    .insert({
      ticket_id: ticketId,
      user_id: profile.id,
      message: parsed.data.message,
      is_internal: isInternal,
    })
    .select('*, users(full_name, email)')
    .single();
  if (error) return jsonError(error.message, 500);

  void recordCommentNotifications({
    ticketId,
    ticketTitle: ticket.title,
    ticketStatus: ticket.status as TicketStatus,
    ownerId: ticket.user_id,
    commenterId: profile.id,
    commenterName: profile.full_name ?? profile.email ?? 'Usuario',
    commenterIsAgent: canAccessAgent(profile.role),
    messagePreview: parsed.data.message,
    isInternal,
  });

  return jsonOk(
    {
      ...data,
      alert:
        ticket.status === 'Resolved' && canAccessAgent(profile.role)
          ? {
              type: 'comment_on_resolved',
              message: `Mensaje enviado en ticket resuelto. El usuario recibirá una alerta.`,
            }
          : ticket.status === 'Resolved' && ticket.user_id === profile.id
            ? {
                type: 'user_reply_resolved',
                message: `Tu respuesta fue enviada. El equipo de soporte fue notificado.`,
              }
            : null,
    },
    201
  );
}
