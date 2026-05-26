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

  if (loading) return <p className="text-zinc-500">Cargando tickets…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500">
        No hay tickets. Crea uno para comenzar.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {tickets.map((t) => (
        <li key={t.id}>
          <Link
            href={`/tickets/${t.id}`}
            className="flex flex-col gap-2 px-4 py-4 transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/50"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{t.title}</p>
              <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{t.description}</p>
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
