'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/src/services/authService';
import type { UserRole } from '@/src/types/database';
import { Button } from '@/src/components/ui/Button';
import { Logo } from '@/src/components/layout/Logo';
import { ThemeToggle } from '@/src/components/layout/ThemeToggle';

const links: { href: string; label: string; roles?: UserRole[] }[] = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/tickets', label: 'Tickets' },
  { href: '/tickets/new', label: 'Nuevo ticket', roles: ['User', 'Admin', 'Agent'] },
  { href: '/analytics', label: 'Métricas', roles: ['Admin', 'Agent'] },
  { href: '/settings', label: 'Perfil' },
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
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo href="/dashboard" />
          <nav className="hidden gap-1 sm:flex">
            {visible.map((l) => {
              const active =
                pathname === l.href || pathname.startsWith(l.href + '/');
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-100 text-brand-700'
                      : 'text-muted hover:bg-brand-50 hover:text-brand-700'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 sm:inline">
            {fullName ?? 'Usuario'} · {role}
          </span>
          <Button variant="ghost" onClick={handleLogout} type="button" className="text-sm">
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
