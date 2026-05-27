'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/Button';

type Preview = {
  cronConfigured: boolean;
  dailyReportUrl: string | null;
  hint: string;
  report: {
    summaryText: string;
    total: number;
    openCount: number;
    resolvedCount: number;
    resolutionRate: number;
    highPriorityOpen: number;
    createdLast24Hours: number;
  };
};

export function DailyReportPanel() {
  const [data, setData] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPreview() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/daily-report-preview');
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? 'Error al cargar');
      return;
    }
    setData(json);
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
      <h2 className="mb-2 font-semibold text-brand-900">Reporte diario (cron n8n)</h2>
      <p className="mb-4 text-sm text-muted">
        Vista previa del JSON que el workflow cron debe obtener con{' '}
        <code>GET /api/reports/daily</code> y el header <code>X-Cron-Secret</code>.
      </p>
      <Button type="button" onClick={loadPreview} disabled={loading}>
        {loading ? 'Cargando…' : 'Vista previa del reporte'}
      </Button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {data && (
        <div className="mt-4 space-y-3 text-sm">
          <p>
            Secreto cron configurado: <strong>{String(data.cronConfigured)}</strong>
          </p>
          {data.dailyReportUrl && (
            <p className="break-all">
              URL para n8n: <code>{data.dailyReportUrl}</code>
            </p>
          )}
          <p className="text-muted">{data.hint}</p>
          <pre className="overflow-x-auto rounded-xl bg-brand-50 p-3 text-xs text-brand-900">
            {data.report.summaryText}
          </pre>
          <details>
            <summary className="cursor-pointer font-medium">JSON completo</summary>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-brand-50 p-3 text-xs text-brand-900">
              {JSON.stringify(data.report, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
