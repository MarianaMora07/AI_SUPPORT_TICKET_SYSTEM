import { createClient } from '@/src/lib/supabase/server';
import type { User, UserRole } from '@/src/types/database';

export interface SessionProfile extends User {}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at')
    .eq('id', user.id)
    .single();

  return profile as SessionProfile | null;
}

export function canAccessAdmin(role: UserRole) {
  return role === 'Admin';
}

export function canAccessAgent(role: UserRole) {
  return role === 'Agent' || role === 'Admin';
}

export function canAccessAnalytics(role: UserRole) {
  return role === 'Admin' || role === 'Agent';
}
