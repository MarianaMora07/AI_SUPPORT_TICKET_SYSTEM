import type { TicketPriority, TicketStatus } from '@/src/types/database';

const badgeBase =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold';

const statusColors: Record<TicketStatus, string> = {
  Open:
    'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-700/60 dark:bg-blue-900/50 dark:text-blue-100',
  'In Progress':
    'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700/60 dark:bg-amber-900/50 dark:text-amber-100',
  Resolved:
    'border-green-300 bg-green-50 text-green-950 dark:border-green-700/60 dark:bg-green-900/50 dark:text-green-100',
};

const priorityColors: Record<TicketPriority, string> = {
  Low:
    'border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-600/60 dark:bg-zinc-700/40 dark:text-zinc-100',
  Medium:
    'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-700/60 dark:bg-sky-900/50 dark:text-sky-100',
  High:
    'border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-700/60 dark:bg-orange-900/50 dark:text-orange-100',
  Urgent:
    'border-red-300 bg-red-50 text-red-950 dark:border-red-700/60 dark:bg-red-900/50 dark:text-red-100',
};

const riskColors: Record<string, string> = {
  low: 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700/60 dark:bg-emerald-900/50 dark:text-emerald-100',
  medium:
    'border-purple-300 bg-purple-50 text-purple-950 dark:border-purple-700/60 dark:bg-purple-900/50 dark:text-purple-100',
  high: 'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-700/60 dark:bg-rose-900/50 dark:text-rose-100',
};

const defaultRiskColor =
  'border-purple-300 bg-purple-50 text-purple-950 dark:border-purple-700/60 dark:bg-purple-900/50 dark:text-purple-100';

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`${badgeBase} ${statusColors[status]}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`${badgeBase} ${priorityColors[priority]}`}>
      {priority}
    </span>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const key = level.trim().toLowerCase();
  return (
    <span className={`${badgeBase} ${riskColors[key] ?? defaultRiskColor}`}>
      Riesgo: {level}
    </span>
  );
}
