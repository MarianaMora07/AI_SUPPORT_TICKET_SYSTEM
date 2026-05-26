'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/Button';

type TestResult = {
  configured: { ticketCreated: boolean; highPriority: boolean; hasSecret: boolean };
  results: {
    ok: boolean;
    envKey: string;
    status?: number;
    hint?: string;
    error?: string;
    urlHost?: string;
    bodyPreview?: string;
  }[];
  allOk: boolean;
};

export function N8nTestPanel() {
  const [data, setData] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runTest() {
    setLoading(true);
    const res = await fetch('/api/admin/n8n-test', { method: 'POST' });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-2 font-semibold">Probar conexión n8n</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Envía un POST de prueba a las URLs de <code>.env.local</code>. Revisa también Executions en n8n.
      </p>
      <Button type="button" onClick={runTest} disabled={loading}>
        {loading ? 'Probando…' : 'Probar webhooks'}
      </Button>

      {data && (
        <div className="mt-4 space-y-3 text-sm">
          <p>
            Variables cargadas: ticket_created={String(data.configured?.ticketCreated)} · high_priority=
            {String(data.configured?.highPriority)}
          </p>
          {data.results?.map((r) => (
            <div
              key={r.envKey}
              className={`rounded-lg p-3 ${r.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
            >
              <p className="font-medium">
                {r.envKey}: {r.ok ? 'OK' : 'FALLO'} {r.status ? `(${r.status})` : ''}
              </p>
              {r.urlHost && <p>Host: {r.urlHost}</p>}
              {r.hint && <p>{r.hint}</p>}
              {r.error && <p>{r.error}</p>}
              {r.bodyPreview && <p className="mt-1 break-all opacity-80">{r.bodyPreview}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
