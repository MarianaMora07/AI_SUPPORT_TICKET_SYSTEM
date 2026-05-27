import Link from 'next/link';

export function Logo({ href = '/', className = '' }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`group flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-md shadow-brand-600/30 transition group-hover:bg-brand-700">
        TS
      </span>
      <span className="text-lg font-bold tracking-tight text-brand-900">
        Ticket<span className="text-brand-600">System</span>
      </span>
    </Link>
  );
}
