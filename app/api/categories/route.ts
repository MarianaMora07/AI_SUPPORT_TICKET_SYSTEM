import { z } from 'zod';
import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile, canAccessAdmin } from '@/src/lib/auth';

const patchSchema = z.object({
  id: z.string().uuid(),
  resolution_sla_days: z.number().int().min(1).max(90),
});

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401, 'UNAUTHORIZED');
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}

export async function PATCH(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAdmin(profile.role)) return jsonError('Solo administradores', 403);
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Datos inválidos', 400);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .update({ resolution_sla_days: parsed.data.resolution_sla_days })
    .eq('id', parsed.data.id)
    .select('*')
    .single();
  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}
