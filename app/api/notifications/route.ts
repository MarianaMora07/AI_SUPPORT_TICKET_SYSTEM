import { z } from 'zod';
import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile } from '@/src/lib/auth';
import { notificationKindsForRole } from '@/src/services/notificationService';
import type { Notification } from '@/src/types/database';

const patchSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  ticketId: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
});

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401);

  const supabase = await createClient();
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const allowedKinds = notificationKindsForRole(profile.role);
  if (allowedKinds) {
    query = query.in('kind', allowedKinds);
  }

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);

  const notifications = (data ?? []) as Notification[];
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  return jsonOk({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401);

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError('Datos inválidos', 400);

  const supabase = await createClient();
  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', profile.id)
    .eq('is_read', false);

  const allowedKinds = notificationKindsForRole(profile.role);
  if (allowedKinds) {
    query = query.in('kind', allowedKinds);
  }

  if (parsed.data.markAll) {
    const { error } = await query;
    if (error) return jsonError(error.message, 500);
    return jsonOk({ ok: true });
  }

  if (parsed.data.ticketId) {
    const { error } = await query.eq('ticket_id', parsed.data.ticketId);
    if (error) return jsonError(error.message, 500);
    return jsonOk({ ok: true });
  }

  if (parsed.data.ids?.length) {
    const { error } = await query.in('id', parsed.data.ids);
    if (error) return jsonError(error.message, 500);
    return jsonOk({ ok: true });
  }

  return jsonError('Indica ids, ticketId o markAll', 400);
}
