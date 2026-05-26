import type { TicketPriority, TicketStatus } from '@/src/types/database';

const statusColors: Record<TicketStatus, string> = {
  Open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'In Progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Resolved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

const priorityColors: Record<TicketPriority, string> = {
  Low: 'bg-zinc-100 text-zinc-700',
  Medium: 'bg-sky-100 text-sky-800',
  High: 'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800',
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
