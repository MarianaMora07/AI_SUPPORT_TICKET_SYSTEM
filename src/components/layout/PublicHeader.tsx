import Link from 'next/link';
import { Logo } from '@/src/components/layout/Logo';
import { ThemeToggle } from '@/src/components/layout/ThemeToggle';
import { ButtonLink } from '@/src/components/ui/Button';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted sm:flex">
          <a href="#caracteristicas" className="transition hover:text-brand-600">
            Características
          </a>
          <a href="#como-funciona" className="transition hover:text-brand-600">
            Cómo funciona
          </a>
          <a href="#roles" className="transition hover:text-brand-600">
            Roles
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <ButtonLink href="/login" variant="ghost" className="hidden px-4 sm:inline-flex">
            Iniciar sesión
          </ButtonLink>
          <ButtonLink href="/register" variant="primary" className="px-4 sm:px-5">
            Registrarse
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
