import { createClient } from '@/src/lib/supabase/client';
import type { UserRole } from '@/src/types/database';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
}

async function syncProfileAfterAuth() {
  const res = await fetch('/api/auth/ensure-profile', { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ??
        'Falta perfil en public.users. Configura SUPABASE_SERVICE_ROLE_KEY en .env.local'
    );
  }
}

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await syncProfileAfterAuth();
    return data;
  },

  async signUp(email: string, password: string, fullName: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Error al registrarse');

    const supabase = createClient();
    const { data: session, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return session;
  },

  async getCurrentProfile(): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: profile, error: dbError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .single();

    if (dbError || !profile) return null;
    return profile as UserProfile;
  },

  async logout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async updatePassword(newPassword: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },
};
