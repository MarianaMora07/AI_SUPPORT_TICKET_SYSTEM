import { log } from '@/src/lib/logger';

export type N8nWebhookResult = {
  ok: boolean;
  envKey: string;
  status?: number;
  statusText?: string;
  bodyPreview?: string;
  urlHost?: string;
  error?: string;
  hint?: string;
};

function normalizeWebhookUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const url = raw.trim().replace(/^["']|["']$/g, '');
  if (!url.startsWith('https://')) return null;
  return url;
}

function hintForStatus(status: number, url: string): string | undefined {
  if (status !== 404) return undefined;
  if (url.includes('/webhook-test/')) {
    return 'Usas URL de TEST. Con workflow ACTIVO usa Production URL (/webhook/ sin "-test").';
  }
  return '404: activa el workflow en n8n y copia Production URL. Mensaje típico: webhook "POST xxx" is not registered.';
}

export async function triggerN8nWebhook(
  envKey: string,
  payload: Record<string, unknown>
): Promise<N8nWebhookResult> {
  const url = normalizeWebhookUrl(process.env[envKey]);
  if (!url) {
    log('warn', `n8n webhook ${envKey} not configured`, { envKey });
    return { ok: false, envKey, error: `Variable ${envKey} vacía o URL inválida` };
  }

  let host = '';
  try {
    host = new URL(url).host;
  } catch {
    return { ok: false, envKey, error: 'URL mal formada' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { 'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    const bodyText = await res.text().catch(() => '');
    const bodyPreview = bodyText.slice(0, 300);

    if (!res.ok) {
      const hint = hintForStatus(res.status, url);
      log('error', 'n8n webhook failed', { envKey, status: res.status, host, hint, bodyPreview });
      return { ok: false, envKey, status: res.status, statusText: res.statusText, bodyPreview, urlHost: host, hint };
    }

    log('info', 'n8n webhook ok', { envKey, status: res.status, host });
    return { ok: true, envKey, status: res.status, urlHost: host, bodyPreview };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    log('error', 'n8n webhook error', { envKey, host, error: message });
    return { ok: false, envKey, urlHost: host, error: message };
  }
}

export async function testAllN8nWebhooks(): Promise<N8nWebhookResult[]> {
  const sample = {
    event: 'connectivity.test',
    ticketId: '00000000-0000-0000-0000-000000000000',
    title: 'Prueba',
    userEmail: 'test@example.com',
    userName: 'Test',
    status: 'Open',
    createdAt: new Date().toISOString(),
  };
  return Promise.all([
    triggerN8nWebhook('N8N_WEBHOOK_TICKET_CREATED', sample),
    triggerN8nWebhook('N8N_WEBHOOK_HIGH_PRIORITY', { ...sample, event: 'ticket.high_priority', priority: 'High', riskLevel: 'high' }),
  ]);
}
