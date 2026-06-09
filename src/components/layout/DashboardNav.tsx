'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/src/services/authService';
import type { UserRole } from '@/src/types/database';
import { Button } from '@/src/components/ui/Button';
import { Logo } from '@/src/components/layout/Logo';
import { ThemeToggle } from '@/src/components/layout/ThemeToggle';
import { NotificationProvider } from '@/src/components/notifications/NotificationProvider';
import { AlertsDropdown } from '@/src/components/alerts/AlertsDropdown';

const DRAWER_ANIMATION_MS = 280;

type DrawerState = 'closed' | 'open' | 'closing';

const links: { href: string; label: string; roles?: UserRole[] }[] = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/tickets', label: 'Tickets' },
  { href: '/tickets/new', label: 'Nuevo ticket', roles: ['User', 'Admin', 'Agent'] },
  { href: '/analytics', label: 'Métricas', roles: ['Admin', 'Agent'] },
  { href: '/settings', label: 'Perfil' },
  { href: '/admin/users', label: 'Usuarios', roles: ['Admin'] },
  { href: '/admin/categories', label: 'SLA categorías', roles: ['Admin'] },
];

function isLinkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

function navLinkClassName(active: boolean, variant: 'desktop' | 'mobile') {
  const base =
    variant === 'mobile'
      ? 'block rounded-xl px-4 py-3 text-base font-medium transition'
      : 'rounded-lg px-3 py-2 text-sm font-medium transition';
  return `${base} ${
    active
      ? 'bg-brand-100 text-brand-700'
      : 'text-muted hover:bg-brand-50 hover:text-brand-700'
  }`;
}

export function DashboardNav({
  role,
  fullName,
}: {
  role: UserRole;
  fullName: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerState, setDrawerState] = useState<DrawerState>('closed');

  const visible = links.filter((l) => !l.roles || l.roles.includes(role));
  const drawerVisible = drawerState !== 'closed';
  const drawerClosing = drawerState === 'closing';

  function openDrawer() {
    setDrawerState('open');
  }

  function closeDrawer() {
    setDrawerState((state) => (state === 'open' ? 'closing' : state));
  }

  useEffect(() => {
    setDrawerState((state) => (state === 'open' ? 'closing' : state));
  }, [pathname]);

  useEffect(() => {
    if (drawerState !== 'closing') return;
    const timer = window.setTimeout(() => setDrawerState('closed'), DRAWER_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [drawerState]);

  useEffect(() => {
    if (drawerState !== 'open') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [drawerState]);

  async function handleLogout() {
    closeDrawer();
    await authService.logout();
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-brand-700 transition hover:bg-brand-50 sm:hidden"
              aria-label="Abrir menú"
              aria-expanded={drawerState === 'open'}
              onClick={openDrawer}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>
            <Logo href="/dashboard" />
            <nav className="hidden gap-1 sm:flex">
              {visible.map((l) => {
                const active = isLinkActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={navLinkClassName(active, 'desktop')}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <AlertsDropdown role={role} />
            <NotificationProvider />
            <ThemeToggle className="hidden sm:inline-flex" />
            <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 sm:inline">
              {fullName ?? 'Usuario'} · {role}
            </span>
            <Button
              variant="ghost"
              onClick={handleLogout}
              type="button"
              className="hidden text-sm sm:inline-flex"
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      {drawerVisible && (
        <>
          <button
            type="button"
            className={`fixed inset-0 z-40 bg-black/30 sm:hidden ${
              drawerClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
            }`}
            aria-label="Cerrar menú"
            onClick={closeDrawer}
          />
          <aside
            className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-border bg-surface shadow-xl sm:hidden ${
              drawerClosing ? 'animate-slide-out-left' : 'animate-slide-in-left'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-semibold text-brand-900">Menú</p>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg p-2 text-brand-700 transition hover:bg-brand-50"
                aria-label="Cerrar menú"
                onClick={closeDrawer}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto p-3">
              <ul className="space-y-1">
                {visible.map((l) => {
                  const active = isLinkActive(pathname, l.href);
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className={navLinkClassName(active, 'mobile')}
                        onClick={closeDrawer}
                      >
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="space-y-3 border-t border-border p-4">
              <p className="rounded-full bg-brand-50 px-3 py-2 text-center text-xs font-medium text-brand-800">
                {fullName ?? 'Usuario'} · {role}
              </p>
              <ThemeToggle className="w-full justify-center" />
              <Button
                variant="ghost"
                onClick={handleLogout}
                type="button"
                className="w-full text-sm"
              >
                Salir
              </Button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
