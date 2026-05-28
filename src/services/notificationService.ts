import { createAdminClient } from '@/src/lib/supabase/admin';
import type { N8nWebhookResult } from '@/src/lib/n8n';
import { log } from '@/src/lib/logger';

function n8nStatusLabel(result: N8nWebhookResult): string {
  if (result.ok) return 'OK';
  return result.error ?? result.hint ?? `Error HTTP ${result.status ?? 'desconocido'}`;
}

async function recordNotification(input: {
  userId: string;
  ticketId: string;
  message: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('notifications').insert({
      user_id: input.userId,
      ticket_id: input.ticketId,
      message: input.message,
      is_read: false,
    });
    if (error) {
      log('error', 'notification insert failed', {
        userId: input.userId,
        ticketId: input.ticketId,
        error: error.message,
      });
    }
  } catch (err) {
    log('error', 'notification insert exception', {
      userId: input.userId,
      ticketId: input.ticketId,
      error: err instanceof Error ? err.message : 'unknown',
    });
  }
}

async function getAgentAndAdminIds(): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('users')
    .select('id')
    .in('role', ['Agent', 'Admin']);
  if (error) {
    log('error', 'failed to load agents for notifications', { error: error.message });
    return [];
  }
  return (data ?? []).map((u) => u.id);
}

export async function recordTicketCreatedNotifications(input: {
  ticketId: string;
  ticketTitle: string;
  ownerId: string;
  event: string;
  n8nResult: N8nWebhookResult;
}): Promise<void> {
  const status = n8nStatusLabel(input.n8nResult);
  const message = `[email] ${input.event}: "${input.ticketTitle}". Envío n8n: ${status}`;
  await recordNotification({
    userId: input.ownerId,
    ticketId: input.ticketId,
    message,
  });
}

export async function recordHighPriorityNotifications(input: {
  ticketId: string;
  ticketTitle: string;
  ownerId: string;
  event: string;
  priority?: string;
  riskLevel?: string | null;
  n8nResult: N8nWebhookResult;
}): Promise<void> {
  const status = n8nStatusLabel(input.n8nResult);
  const detail = [input.priority, input.riskLevel].filter(Boolean).join(' · ');
  const message = `[slack] ${input.event}: "${input.ticketTitle}"${detail ? ` (${detail})` : ''}. Envío n8n: ${status}`;

  const agentIds = await getAgentAndAdminIds();
  const recipientIds = new Set<string>([input.ownerId, ...agentIds]);

  await Promise.all(
    [...recipientIds].map((userId) =>
      recordNotification({ userId, ticketId: input.ticketId, message })
    )
  );
}
