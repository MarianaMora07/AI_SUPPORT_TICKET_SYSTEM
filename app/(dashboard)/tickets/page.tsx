import Link from 'next/link';
import { TicketList } from '@/src/components/tickets/TicketList';
import { getSessionProfile } from '@/src/lib/auth';
import { Button } from '@/src/components/ui/Button';

const SLA_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'breached', label: 'Vencidos' },
  { value: 'warning', label: 'En advertencia' },
  { value: 'on_track', label: 'En tiempo' },
] as const;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ sla?: string }>;
}) {
  const profile = await getSessionProfile();
  const { sla } = await searchParams;
  const slaFilter = sla && SLA_FILTERS.some((f) => f.value === sla) ? sla : undefined;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-brand-900">Tickets</h1>
        {profile?.role === 'User' && (
          <Link href="/tickets/new">
            <Button>Nuevo ticket</Button>
          </Link>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {SLA_FILTERS.map((f) => {
          const active = (slaFilter ?? '') === f.value;
          const href = f.value ? `/tickets?sla=${f.value}` : '/tickets';
          return (
            <Link
              key={f.value || 'all'}
              href={href}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                active
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-border bg-surface text-muted hover:border-brand-300 hover:text-brand-800'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <TicketList slaFilter={slaFilter} />
    </div>
  );
}
