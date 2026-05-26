import Link from 'next/link';
import { TicketDetail } from '@/src/components/tickets/TicketDetail';
import { getSessionProfile } from '@/src/lib/auth';

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getSessionProfile();
  if (!profile) return null;
  return (
    <div>
      <Link href="/tickets" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">← Volver</Link>
      <TicketDetail ticketId={id} role={profile.role} />
    </div>
  );
}
