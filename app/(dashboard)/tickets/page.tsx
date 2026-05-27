import Link from 'next/link';
import { TicketList } from '@/src/components/tickets/TicketList';
import { getSessionProfile } from '@/src/lib/auth';
import { Button } from '@/src/components/ui/Button';

export default async function TicketsPage() {
  const profile = await getSessionProfile();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Tickets</h1>
        {profile?.role === 'User' && (
          <Link href="/tickets/new"><Button>Nuevo ticket</Button></Link>
        )}
      </div>
      <TicketList />
    </div>
  );
}
