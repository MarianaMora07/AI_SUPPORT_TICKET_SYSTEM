import { Logo } from '@/src/components/layout/Logo';

export function PublicFooter() {
  return (
    <footer className="border-t border-brand-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo href="/" />
        <p className="text-center text-sm text-muted">
          Plataforma de soporte técnico con inteligencia artificial · Mora
        </p>
        <p className="text-sm text-muted">© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
