import Link from 'next/link';

export function Logo({
  href = '/',
  className = '',
  compactOnMobile = false,
}: {
  href?: string;
  className?: string;
  compactOnMobile?: boolean;
}) {
  return (
    <Link href={href} className={`group flex min-w-0 items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-md shadow-brand-600/30 transition group-hover:bg-brand-700">
        TS
      </span>
      <span
        className={`truncate text-lg font-bold tracking-tight text-brand-900 ${
          compactOnMobile ? 'hidden min-[380px]:inline' : ''
        }`}
      >
        Ticket<span className="text-brand-600">System</span>
      </span>
    </Link>
  );
}
