import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/src/lib/auth';
import { ProfileSettingsForm } from '@/src/components/profile/ProfileSettingsForm';

export default async function SettingsPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login');

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-900">Perfil y seguridad</h1>
        <p className="mt-2 text-sm text-muted">
          Administra tus datos de registro y credenciales de acceso.
        </p>
      </div>
      <ProfileSettingsForm initialName={profile.full_name ?? ''} email={profile.email} />
    </div>
  );
}
