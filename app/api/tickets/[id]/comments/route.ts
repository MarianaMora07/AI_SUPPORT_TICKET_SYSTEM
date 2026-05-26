import { z } from 'zod';
import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile, canAccessAgent } from '@/src/lib/auth';

const commentSchema = z.object({ message: z.string().min(1), is_internal: z.boolean().optional() });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401);
  const supabase = await createClient();
  let query = supabase.from('comments').select('*, users(full_name, email, role)').eq('ticket_id', id).order('created_at');
  if (!canAccessAgent(profile.role)) query = query.eq('is_internal', false);
  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401);
  const parsed = commentSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError('Mensaje requerido', 400);
  const isInternal = parsed.data.is_internal ?? false;
  if (isInternal && !canAccessAgent(profile.role)) return jsonError('Sin permiso', 403);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('comments')
    .insert({ ticket_id: id, user_id: profile.id, message: parsed.data.message, is_internal: isInternal })
    .select('*, users(full_name, email)')
    .single();
  if (error) return jsonError(error.message, 500);
  return jsonOk(data, 201);
}
