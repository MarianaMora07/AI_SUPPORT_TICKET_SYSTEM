'use client';

import { useEffect, useState } from 'react';

interface Analytics {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  openCount: number;
  resolvedCount: number;
  resolutionRate: number;
  createdLast7Days: number;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando métricas…</p>;
  if (!data || !('total' in data)) return <p>No se pudieron cargar las métricas.</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total tickets" value={data.total} />
        <MetricCard label="Abiertos" value={data.openCount} />
        <MetricCard label="Resueltos" value={data.resolvedCount} />
        <MetricCard label="Tasa resolución" value={`${data.resolutionRate}%`} />
      </div>
      <MetricCard label="Creados (7 días)" value={data.createdLast7Days} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-brand-900">Por estado</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(data.byStatus).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <strong>{v}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-brand-900">Por prioridad</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(data.byPriority).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <strong>{v}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:shadow-md">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-600">{value}</p>
    </div>
  );
}
