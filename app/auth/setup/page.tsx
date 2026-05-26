'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthSetupPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Creando tu perfil…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/auth/ensure-profile', { method: 'POST' })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          router.replace('/dashboard');
          router.refresh();
          return;
        }
        setFailed(true);
        setMessage(data.error ?? 'No se pudo completar el perfil.');
      })
      .catch(() => {
        setFailed(true);
        setMessage('Error de conexión.');
      });
  }, [router]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className={failed ? 'text-red-600' : 'text-zinc-600'}>{message}</p>
        {failed && (
          <Link href="/login" className="mt-4 inline-block text-indigo-600 hover:underline">
            Volver al login
          </Link>
        )}
      </div>
    </div>
  );
}
