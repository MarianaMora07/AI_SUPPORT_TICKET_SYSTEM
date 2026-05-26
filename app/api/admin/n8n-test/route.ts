import { getSessionProfile, canAccessAdmin } from '@/src/lib/auth';
import { jsonError, jsonOk } from '@/src/lib/api-response';
import { testAllN8nWebhooks } from '@/src/lib/n8n';

export async function POST() {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAdmin(profile.role)) return jsonError('Solo administradores', 403);
  const results = await testAllN8nWebhooks();
  return jsonOk({
    configured: {
      ticketCreated: !!process.env.N8N_WEBHOOK_TICKET_CREATED?.trim(),
      highPriority: !!process.env.N8N_WEBHOOK_HIGH_PRIORITY?.trim(),
    },
    results,
    allOk: results.every((r) => r.ok),
  });
}
