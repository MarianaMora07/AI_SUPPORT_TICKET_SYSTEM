'use client';

import { useEffect, useState } from 'react';
import { getSlaLabel, type SlaStatus } from '@/src/lib/sla';

interface Analytics {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  bySlaStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byRisk: Record<string, number>;
  openCount: number;
  resolvedCount: number;
  resolutionRate: number;
  createdLast7Days: number;
  slaComplianceRate: number;
  openBreached: number;
  openWarning: number;
  slaMetCount: number;
  slaEvaluatedCount: number;
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

  if (loading) return <p className="text-muted">Cargando métricas…</p>;
  if (!data || !('total' in data)) return <p>No se pudieron cargar las métricas.</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total tickets" value={data.total} />
        <MetricCard label="Abiertos" value={data.openCount} />
        <MetricCard label="Resueltos" value={data.resolvedCount} />
        <MetricCard label="Tasa resolución" value={`${data.resolutionRate}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="SLA cumplido" value={`${data.slaComplianceRate}%`} />
        <MetricCard label="Vencidos abiertos" value={data.openBreached} />
        <MetricCard label="En advertencia" value={data.openWarning} />
        <MetricCard label="Creados (7 días)" value={data.createdLast7Days} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DistributionCard title="Por estado" items={data.byStatus} />
        <DistributionCard title="Por prioridad" items={data.byPriority} />
        <DistributionCard
          title="Por estado SLA"
          items={Object.fromEntries(
            Object.entries(data.bySlaStatus).map(([k, v]) => [getSlaLabel(k as SlaStatus), v])
          )}
        />
        <DistributionCard title="Por categoría" items={data.byCategory} />
        <DistributionCard title="Por riesgo IA" items={data.byRisk} emptyLabel="Sin clasificar" />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-600">{value}</p>
    </div>
  );
}

function DistributionCard({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: Record<string, number>;
  emptyLabel?: string;
}) {
  const entries = Object.entries(items).filter(([, v]) => v > 0);
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">Distribución</p>
      <h2 className="mb-4 font-semibold text-brand-900">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-muted">{emptyLabel ?? 'Sin datos'}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {entries.map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span>{k}</span>
              <strong>{v}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
