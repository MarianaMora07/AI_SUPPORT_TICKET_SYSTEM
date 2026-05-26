import { RegisterForm } from '@/src/components/auth/AuthForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-2xl font-bold">Crear cuenta</h1>
        <p className="mb-6 text-sm text-zinc-500">Regístrate para reportar incidentes</p>
        <RegisterForm />
      </div>
    </div>
  );
}
