import { z } from 'zod';
import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile, canAccessAdmin } from '@/src/lib/auth';

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAdmin(profile.role)) return jsonError('Solo administradores', 403);
  const supabase = await createClient();
  const { data, error } = await supabase.from('users').select('id, email, full_name, role, created_at').order('created_at', { ascending: false });
  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}

const updateRoleSchema = z.object({ userId: z.string().uuid(), role: z.enum(['Admin', 'Agent', 'User']) });

export async function PATCH(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAdmin(profile.role)) return jsonError('Solo administradores', 403);
  const parsed = updateRoleSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError('Datos inválidos', 400);
  const supabase = await createClient();
  const { data, error } = await supabase.from('users').update({ role: parsed.data.role }).eq('id', parsed.data.userId).select('id, email, full_name, role').single();
  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}
