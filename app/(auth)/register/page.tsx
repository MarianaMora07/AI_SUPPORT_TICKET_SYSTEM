import { RegisterForm } from '@/src/components/auth/AuthForm';
import { AuthShell } from '@/src/components/layout/AuthShell';

export default function RegisterPage() {
  return (
    <AuthShell title="Crear cuenta" subtitle="Regístrate para reportar y dar seguimiento a incidentes">
      <RegisterForm />
    </AuthShell>
  );
}
