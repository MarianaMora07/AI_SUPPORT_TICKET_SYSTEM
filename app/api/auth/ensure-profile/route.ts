import { createClient as createServerClient } from '@/src/lib/supabase/server';
import { jsonError, jsonOk } from '@/src/lib/api-response';
import { ensureUserProfile } from '@/src/lib/ensure-profile-server';

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError('No autenticado', 401);
  const result = await ensureUserProfile(user);
  if (!result.ok) return jsonError(result.error ?? 'Error al crear perfil', 500);
  return jsonOk({ message: 'Perfil listo' });
}
