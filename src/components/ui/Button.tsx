import Link from 'next/link';
import { type ButtonHTMLAttributes } from 'react';

export const buttonBase =
  'inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:pointer-events-none';

export const buttonVariants = {
  primary:
    'bg-brand-600 text-white shadow-md shadow-brand-600/25 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/30 active:scale-[0.98] dark:bg-brand-500 dark:text-slate-950 dark:shadow-brand-900/40 dark:hover:bg-brand-400 dark:hover:shadow-brand-300/35',
  secondary:
    'border-2 border-brand-200 bg-surface text-brand-800 hover:border-brand-400 hover:bg-brand-50 active:scale-[0.98] dark:border-brand-300/60 dark:bg-brand-100/10 dark:text-brand-900 dark:hover:bg-brand-200/20',
  outline:
    'border-2 border-white/80 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  ghost: 'text-brand-700 hover:bg-brand-50',
  light:
    'bg-surface text-brand-800 shadow-md hover:bg-brand-50 active:scale-[0.98] dark:bg-brand-100/15 dark:text-brand-900 dark:hover:bg-brand-200/25 dark:shadow-brand-900/40',
} as const;

type Variant = keyof typeof buttonVariants;

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`${buttonBase} ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  className = '',
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${buttonBase} ${buttonVariants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
