import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile } from '@/src/lib/auth';

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401, 'UNAUTHORIZED');
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return jsonError(error.message, 500);
  return jsonOk(data);
}
