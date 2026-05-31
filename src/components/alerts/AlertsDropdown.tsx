'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { UserRole } from '@/src/types/database';
import type { ActionAlert } from '@/src/services/alertService';

const severityStyles = {
  critical: 'border-l-red-500 bg-red-50',
  warning: 'border-l-amber-500 bg-amber-50',
  info: 'border-l-sky-500 bg-sky-50',
};

function AlertsList({
  alerts,
  loading,
  emptyLabel,
}: {
  alerts: ActionAlert[];
  loading: boolean;
  emptyLabel: string;
}) {
  if (loading) {
    return <p className="px-4 py-6 text-center text-sm text-muted">Cargando avisos…</p>;
  }
  if (alerts.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-muted">{emptyLabel}</p>;
  }
  return (
    <ul className="max-h-80 overflow-y-auto">
      {alerts.map((alert) => (
        <li key={alert.id} className="border-b border-border last:border-b-0">
          <Link
            href={alert.href}
            className={`block border-l-4 px-4 py-3 text-sm transition hover:bg-brand-50 ${severityStyles[alert.severity]}`}
          >
            <p className="font-medium text-brand-900">{alert.title}</p>
            <p className="mt-1 line-clamp-2 text-muted">{alert.message}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AlertsDropdown({ role }: { role: UserRole }) {
  const isAgent = role === 'Agent' || role === 'Admin';
  if (!isAgent) return null;

  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<ActionAlert[]>([]);
  const [summary, setSummary] = useState({ critical: 0, warning: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/alerts');
    const data = await res.json();
    if (data.alerts) setAlerts(data.alerts);
    if (data.summary) setSummary(data.summary);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const badgeCount = summary.critical + summary.warning + summary.info;
  const panelTitle = 'Avisos SLA y pendientes';
  const emptyLabel = 'No hay avisos pendientes. Todo al día.';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-muted transition hover:bg-brand-50 hover:text-brand-700"
        aria-label={panelTitle}
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        {badgeCount > 0 && (
          <span
            className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
              summary.critical > 0 ? 'bg-red-500' : 'bg-amber-500'
            }`}
          >
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="font-semibold text-brand-900">{panelTitle}</p>
            {badgeCount > 0 && (
              <p className="mt-1 text-xs text-muted">
                {summary.critical > 0 && `${summary.critical} crítica${summary.critical !== 1 ? 's' : ''}`}
                {summary.critical > 0 && summary.warning > 0 && ' · '}
                {summary.warning > 0 && `${summary.warning} advertencia${summary.warning !== 1 ? 's' : ''}`}
                {(summary.critical > 0 || summary.warning > 0) && summary.info > 0 && ' · '}
                {summary.info > 0 && `${summary.info} pendiente${summary.info !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          <AlertsList alerts={alerts} loading={loading} emptyLabel={emptyLabel} />
          {alerts.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <Link
                href="/tickets?sla=breached"
                className="text-xs font-medium text-brand-600 hover:underline"
                onClick={() => setOpen(false)}
              >
                Ver tickets vencidos →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
