'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  StatusBadge,
  PriorityBadge,
  RiskBadge,
  SlaBadge,
  AiPendingBadge,
} from '@/src/components/ui/Badge';
import type { Notification, Ticket } from '@/src/types/database';
import { USER_NOTIFICATION_KINDS } from '@/src/services/notificationService';
import { getSlaStatus, formatSlaRemaining } from '@/src/lib/sla';
import { sortTicketsByPriority } from '@/src/lib/ticket-sort';

function isPriorityPending(ticket: Ticket): boolean {
  if (ticket.ai_priority_assigned_at) return false;
  const ageMs = Date.now() - new Date(ticket.created_at).getTime();
  return ageMs < 2 * 60 * 1000;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function TicketList({
  statusFilter,
  slaFilter,
}: {
  statusFilter?: string;
  slaFilter?: string;
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [unreadByTicket, setUnreadByTicket] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (!data.notifications) return;
        const map: Record<string, number> = {};
        for (const n of data.notifications as Notification[]) {
          if (!n.is_read && n.ticket_id && USER_NOTIFICATION_KINDS.includes(n.kind)) {
            map[n.ticket_id] = (map[n.ticket_id] ?? 0) + 1;
          }
        }
        setUnreadByTicket(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (slaFilter) params.set('slaStatus', slaFilter);
    const qs = params.toString();
    const url = qs ? `/api/tickets?${qs}` : '/api/tickets';

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else if (Array.isArray(data)) setTickets(sortTicketsByPriority(data as Ticket[]));
        else setError('Respuesta inválida del servidor');
      })
      .catch(() => setError('Error al cargar tickets'))
      .finally(() => setLoading(false));
  }, [statusFilter, slaFilter]);

  if (loading) return <p className="text-muted">Cargando tickets…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-200 bg-surface p-12 text-center text-muted">
        No hay tickets. Crea uno para comenzar.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      {tickets.map((t) => {
        const slaStatus = getSlaStatus(t);
        const categoryName =
          t.categories && typeof t.categories === 'object' && 'name' in t.categories
            ? (t.categories as { name: string }).name
            : null;

        return (
          <li key={t.id}>
            <Link
              href={`/tickets/${t.id}`}
              className="flex flex-col gap-2 px-4 py-4 transition hover:bg-brand-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand-900">{t.title}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted">{t.description}</p>
                </div>
                {(unreadByTicket[t.id] ?? 0) > 0 && (
                  <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadByTicket[t.id]} nuevo{unreadByTicket[t.id] !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
                {isPriorityPending(t) && (
                  <AiPendingBadge label="Asignando prioridad IA…" />
                )}
                {t.ai_risk_level && <RiskBadge level={t.ai_risk_level} />}
                {t.sla_deadline && <SlaBadge status={slaStatus} />}
              </div>
              <div className="flex flex-wrap gap-x-4 text-xs text-muted">
                {categoryName && <span>Categoría: {categoryName}</span>}
                {t.sla_deadline && <span>{formatSlaRemaining(t)}</span>}
                <span>Creado: {formatDate(t.created_at)}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
