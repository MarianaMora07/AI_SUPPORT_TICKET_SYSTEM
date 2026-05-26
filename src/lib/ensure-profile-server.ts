import { createClient } from '@supabase/supabase-js';
import type { User as AuthUser } from '@supabase/supabase-js';

export async function ensureUserProfile(authUser: AuthUser): Promise<{ ok: boolean; error?: string }> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY no configurada' };
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await admin.from('users').select('id').eq('id', authUser.id).maybeSingle();
  if (existing) return { ok: true };

  const { error } = await admin.from('users').insert({
    id: authUser.id,
    email: authUser.email!,
    full_name: (authUser.user_metadata?.full_name as string) ?? 'Usuario Nuevo',
    role: 'User',
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
