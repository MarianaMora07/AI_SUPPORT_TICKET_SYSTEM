import { LoginForm } from '@/src/components/auth/AuthForm';
import { AuthShell } from '@/src/components/layout/AuthShell';

export default function LoginPage() {
  return (
    <AuthShell title="Iniciar sesión" subtitle="Accede a tu panel de soporte técnico">
      <LoginForm />
    </AuthShell>
  );
}
