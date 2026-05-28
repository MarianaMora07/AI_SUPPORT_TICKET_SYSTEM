import type { TicketPriority, TicketStatus } from '@/src/types/database';

const statusColors: Record<TicketStatus, string> = {
  Open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'In Progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Resolved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

const priorityColors: Record<TicketPriority, string> = {
  Low: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700/30 dark:text-zinc-200',
  Medium: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  High: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  Urgent: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[priority]}`}>
      {priority}
    </span>
  );
}
