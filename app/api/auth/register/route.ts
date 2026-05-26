import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { jsonError, jsonOk } from '@/src/lib/api-response';
import { ensureUserProfile } from '@/src/lib/ensure-profile-server';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError('Datos inválidos', 400);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return jsonError('Añade SUPABASE_SERVICE_ROLE_KEY en .env.local', 503, 'MISSING_CONFIG');
  }
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });
  if (authError) return jsonError(authError.message, 400);
  if (!authData.user) return jsonError('No se creó el usuario', 500);
  const ensured = await ensureUserProfile(authData.user);
  if (!ensured.ok) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return jsonError(ensured.error ?? 'Error al crear perfil', 500);
  }
  return jsonOk({ message: 'Usuario registrado', userId: authData.user.id }, 201);
}
