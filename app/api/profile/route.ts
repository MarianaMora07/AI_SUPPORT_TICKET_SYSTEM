import { jsonError, jsonOk } from '@/src/lib/api-response';
import { createClient } from '@/src/lib/supabase/server';

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return jsonError('No autorizado', 401, 'UNAUTHORIZED');

  const body = (await request.json().catch(() => ({}))) as { fullName?: string };
  const fullName = body.fullName?.trim();
  if (!fullName) return jsonError('Nombre inválido', 400, 'BAD_REQUEST');

  const { error } = await supabase
    .from('users')
    .update({ full_name: fullName })
    .eq('id', user.id);

  if (error) return jsonError(error.message, 500);
  return jsonOk({ message: 'Perfil actualizado' });
}
