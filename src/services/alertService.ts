import { createAdminClient } from '@/src/lib/supabase/admin';
import { getSlaStatus, getSlaLabel, formatSlaRemaining } from '@/src/lib/sla';
import { recordSlaAlertNotifications } from '@/src/services/notificationService';
import type { Ticket, UserRole } from '@/src/types/database';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface ActionAlert {
  id: string;
  ticketId: string;
  ticketTitle: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  href: string;
  kind: string;
}

export async function computeAgentAlerts(): Promise<ActionAlert[]> {
  const admin = createAdminClient();
  const { data: tickets } = await admin
    .from('tickets')
    .select(
      'id, title, status, priority, sla_deadline, created_at, resolved_at, ai_risk_level, ai_analyzed_at, ai_priority_assigned_at'
    )
    .neq('status', 'Resolved');

  const alerts: ActionAlert[] = [];

  for (const row of tickets ?? []) {
    const ticket = row as Ticket;
    const sla = getSlaStatus(ticket);

    if (sla === 'breached') {
      alerts.push({
        id: `sla-breached-${ticket.id}`,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        severity: 'critical',
        title: 'SLA vencido',
        message: `"${ticket.title}" — ${formatSlaRemaining(ticket)}. Requiere atención urgente.`,
        href: `/tickets/${ticket.id}`,
        kind: 'sla_breached',
      });
      void recordSlaAlertNotifications({
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        kind: 'sla_breached',
        title: 'SLA vencido',
        message: `El ticket "${ticket.title}" superó su plazo de resolución.`,
      });
    } else if (sla === 'warning') {
      alerts.push({
        id: `sla-warning-${ticket.id}`,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        severity: 'warning',
        title: 'SLA en advertencia',
        message: `"${ticket.title}" — ${formatSlaRemaining(ticket)} (${getSlaLabel(sla)}).`,
        href: `/tickets/${ticket.id}`,
        kind: 'sla_warning',
      });
      void recordSlaAlertNotifications({
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        kind: 'sla_warning',
        title: 'SLA en advertencia',
        message: `El ticket "${ticket.title}" está por vencer su plazo de resolución.`,
      });
    }

    if (!ticket.ai_analyzed_at) {
      alerts.push({
        id: `needs-analysis-${ticket.id}`,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        severity: 'info',
        title: 'Pendiente de análisis IA',
        message: `"${ticket.title}" aún no tiene clasificación de riesgo. Analiza y prioriza.`,
        href: `/tickets/${ticket.id}`,
        kind: 'needs_analysis',
      });
    }
  }

  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export async function computeUserAlerts(userId: string): Promise<ActionAlert[]> {
  const admin = createAdminClient();
  const { data: notifications } = await admin
    .from('notifications')
    .select('id, ticket_id, title, message, kind, created_at')
    .eq('user_id', userId)
    .eq('is_read', false)
    .in('kind', ['status_change', 'new_comment', 'comment_on_resolved'])
    .order('created_at', { ascending: false })
    .limit(20);

  return (notifications ?? []).map((n) => ({
    id: n.id,
    ticketId: n.ticket_id ?? '',
    ticketTitle: '',
    severity:
      n.kind === 'comment_on_resolved'
        ? ('warning' as AlertSeverity)
        : ('info' as AlertSeverity),
    title: n.title ?? 'Actualización de ticket',
    message: n.message,
    href: n.ticket_id ? `/tickets/${n.ticket_id}` : '/tickets',
    kind: n.kind,
  }));
}

export function canAccessAlerts(role: UserRole): boolean {
  return role === 'Admin' || role === 'Agent' || role === 'User';
}
