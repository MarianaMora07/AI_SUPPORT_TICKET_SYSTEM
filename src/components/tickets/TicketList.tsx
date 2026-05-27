'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '@/src/components/ui/Badge';
import type { Ticket } from '@/src/types/database';

export function TicketList({ statusFilter }: { statusFilter?: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const url = statusFilter ? `/api/tickets?status=${encodeURIComponent(statusFilter)}` : '/api/tickets';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setTickets(data);
      })
      .catch(() => setError('Error al cargar tickets'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <p className="text-muted">Cargando tickets…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center text-muted">
        No hay tickets. Crea uno para comenzar.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-brand-100 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
      {tickets.map((t) => (
        <li key={t.id}>
          <Link
            href={`/tickets/${t.id}`}
            className="flex flex-col gap-2 px-4 py-4 transition hover:bg-brand-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-brand-900">{t.title}</p>
              <p className="mt-1 line-clamp-1 text-sm text-muted">{t.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
              {t.ai_risk_level && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                  Riesgo: {t.ai_risk_level}
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
