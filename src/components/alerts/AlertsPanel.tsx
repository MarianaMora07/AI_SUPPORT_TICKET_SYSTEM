'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ActionAlert } from '@/src/services/alertService';

const severityStyles = {
  critical: 'border-red-300 bg-red-50 text-red-950',
  warning: 'border-amber-300 bg-amber-50 text-amber-950',
  info: 'border-sky-300 bg-sky-50 text-sky-950',
};

export function AlertsPanel({ compact = false }: { compact?: boolean }) {
  const [alerts, setAlerts] = useState<ActionAlert[]>([]);
  const [summary, setSummary] = useState({ critical: 0, warning: 0, info: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((d) => {
        if (d.alerts) setAlerts(d.alerts);
        if (d.summary) setSummary(d.summary);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Cargando alertas…</p>;

  const visible = compact ? alerts.slice(0, 5) : alerts;

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
        No hay alertas pendientes. Todo al día.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!compact && (summary.critical > 0 || summary.warning > 0) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {summary.critical > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-800">
              {summary.critical} crítica{summary.critical !== 1 ? 's' : ''}
            </span>
          )}
          {summary.warning > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900">
              {summary.warning} advertencia{summary.warning !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      <ul className="space-y-2">
        {visible.map((alert) => (
          <li key={alert.id}>
            <Link
              href={alert.href}
              className={`block rounded-xl border p-4 transition hover:shadow-md ${severityStyles[alert.severity]}`}
            >
              <p className="font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm opacity-90">{alert.message}</p>
            </Link>
          </li>
        ))}
      </ul>

      {compact && alerts.length > 5 && (
        <Link href="/tickets?sla=breached" className="text-sm font-medium text-brand-600 hover:underline">
          Ver todas las alertas ({alerts.length})
        </Link>
      )}
    </div>
  );
}
