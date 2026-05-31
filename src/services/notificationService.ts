import { createAdminClient } from '@/src/lib/supabase/admin';
import type { N8nWebhookResult } from '@/src/lib/n8n';
import { log } from '@/src/lib/logger';
import type { NotificationKind, TicketStatus, UserRole } from '@/src/types/database';

/** Tipos visibles para usuarios finales (solo progreso de su ticket). */
export const USER_NOTIFICATION_KINDS: NotificationKind[] = [
  'status_change',
  'new_comment',
  'comment_on_resolved',
];

/** Tipos operativos solo para agentes/admin. */
export const AGENT_NOTIFICATION_KINDS: NotificationKind[] = [
  'high_priority',
  'user_reply_resolved',
  'sla_warning',
  'sla_breached',
  'needs_analysis',
  'ticket_created',
  'system',
];

export function notificationKindsForRole(role: UserRole): NotificationKind[] | null {
  if (role === 'User') return USER_NOTIFICATION_KINDS;
  return null;
}

function n8nStatusLabel(result: N8nWebhookResult): string {
  if (result.ok) return 'OK';
  return result.error ?? result.hint ?? `Error HTTP ${result.status ?? 'desconocido'}`;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  Open: 'Abierto',
  'In Progress': 'En progreso',
  Resolved: 'Resuelto',
};

async function recordNotification(input: {
  userId: string;
  ticketId: string;
  message: string;
  title: string;
  kind: NotificationKind;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('notifications').insert({
      user_id: input.userId,
      ticket_id: input.ticketId,
      message: input.message,
      title: input.title,
      kind: input.kind,
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

export async function recordTicketCreatedNotifications(_input: {
  ticketId: string;
  ticketTitle: string;
  ownerId: string;
  event: string;
  n8nResult: N8nWebhookResult;
}): Promise<void> {
  // Sin notificación in-app al usuario: la confirmación va por email (n8n).
  // El usuario solo recibe alertas de estado y mensajes en su ticket.
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
  const message = `"${input.ticketTitle}" requiere atención${detail ? ` (${detail})` : ''}. Alerta enviada al equipo: ${status}.`;

  const agentIds = await getAgentAndAdminIds();

  await Promise.all(
    agentIds.map((userId) =>
      recordNotification({
        userId,
        ticketId: input.ticketId,
        title: 'Prioridad alta',
        kind: 'high_priority',
        message,
      })
    )
  );
}

export async function recordStatusChangeNotification(input: {
  ticketId: string;
  ticketTitle: string;
  ownerId: string;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  changedByName: string;
}): Promise<void> {
  if (input.previousStatus === input.newStatus) return;

  const prev = STATUS_LABELS[input.previousStatus] ?? input.previousStatus;
  const next = STATUS_LABELS[input.newStatus] ?? input.newStatus;

  await recordNotification({
    userId: input.ownerId,
    ticketId: input.ticketId,
    title: 'Estado actualizado',
    kind: 'status_change',
    message: `${input.changedByName} cambió el estado de "${input.ticketTitle}" de ${prev} a ${next}.`,
  });
}

export async function recordCommentNotifications(input: {
  ticketId: string;
  ticketTitle: string;
  ticketStatus: TicketStatus;
  ownerId: string;
  commenterId: string;
  commenterName: string;
  commenterIsAgent: boolean;
  messagePreview: string;
  isInternal: boolean;
}): Promise<void> {
  if (input.isInternal) return;

  const preview =
    input.messagePreview.length > 120
      ? `${input.messagePreview.slice(0, 117)}…`
      : input.messagePreview;

  if (input.commenterIsAgent) {
    await recordNotification({
      userId: input.ownerId,
      ticketId: input.ticketId,
      title:
        input.ticketStatus === 'Resolved'
          ? 'Nuevo mensaje en ticket resuelto'
          : 'Nuevo mensaje en tu ticket',
      kind: input.ticketStatus === 'Resolved' ? 'comment_on_resolved' : 'new_comment',
      message:
        input.ticketStatus === 'Resolved'
          ? `${input.commenterName} respondió en tu ticket resuelto "${input.ticketTitle}": "${preview}"`
          : `${input.commenterName} comentó en "${input.ticketTitle}": "${preview}"`,
    });
    return;
  }

  if (input.commenterId === input.ownerId && input.ticketStatus === 'Resolved') {
    const agentIds = await getAgentAndAdminIds();
    await Promise.all(
      agentIds.map((userId) =>
        recordNotification({
          userId,
          ticketId: input.ticketId,
          title: 'Usuario respondió en ticket resuelto',
          kind: 'user_reply_resolved',
          message: `El usuario respondió en el ticket resuelto "${input.ticketTitle}": "${preview}". Revisa si requiere reabrirse.`,
        })
      )
    );
  }
}

export async function recordSlaAlertNotifications(input: {
  ticketId: string;
  ticketTitle: string;
  kind: 'sla_warning' | 'sla_breached' | 'needs_analysis';
  message: string;
  title: string;
}): Promise<void> {
  const agentIds = await getAgentAndAdminIds();
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  for (const userId of agentIds) {
    const { data: existing } = await admin
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('ticket_id', input.ticketId)
      .eq('kind', input.kind)
      .gte('created_at', since)
      .limit(1);

    if (existing && existing.length > 0) continue;

    await recordNotification({
      userId,
      ticketId: input.ticketId,
      title: input.title,
      kind: input.kind,
      message: input.message,
    });
  }
}
