'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/src/services/authService';
import type { UserRole } from '@/src/types/database';
import { Button } from '@/src/components/ui/Button';

const links: { href: string; label: string; roles?: UserRole[] }[] = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/tickets', label: 'Tickets' },
  { href: '/tickets/new', label: 'Nuevo ticket', roles: ['User', 'Admin', 'Agent'] },
  { href: '/analytics', label: 'Métricas', roles: ['Admin', 'Agent'] },
  { href: '/admin/users', label: 'Usuarios', roles: ['Admin'] },
];

export function DashboardNav({
  role,
  fullName,
}: {
  role: UserRole;
  fullName: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const visible = links.filter((l) => !l.roles || l.roles.includes(role));

  async function handleLogout() {
    await authService.logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-semibold text-indigo-600">
            AI Support
          </Link>
          <nav className="hidden gap-4 sm:flex">
            {visible.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm ${
                  pathname === l.href || pathname.startsWith(l.href + '/')
                    ? 'font-medium text-indigo-600'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-500 sm:inline">
            {fullName ?? 'Usuario'} · {role}
          </span>
          <Button variant="ghost" onClick={handleLogout} type="button">
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
