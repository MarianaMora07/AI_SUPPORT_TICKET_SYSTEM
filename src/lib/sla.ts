import { coerceRiskLevel } from '@/src/types/ai';
import type { Ticket } from '@/src/types/database';

export const RISK_SLA_DAYS_CAP = { low: 30, medium: 14, high: 7 } as const;
export const DEFAULT_CATEGORY_SLA_DAYS = 14;
export const WARNING_THRESHOLD = 0.2;

export type SlaStatus = 'on_track' | 'warning' | 'breached' | 'met';

type RiskKey = keyof typeof RISK_SLA_DAYS_CAP;

function normalizeRisk(riskLevel: string | null | undefined): RiskKey | null {
  if (!riskLevel) return null;
  const coerced = coerceRiskLevel(riskLevel);
  if (coerced === 'low' || coerced === 'medium' || coerced === 'high') return coerced;
  return null;
}

export function computeResolutionSlaDays(
  categoryDays: number,
  riskLevel: string | null | undefined
): number {
  const days = categoryDays > 0 ? categoryDays : DEFAULT_CATEGORY_SLA_DAYS;
  const risk = normalizeRisk(riskLevel);
  if (!risk) return days;
  return Math.min(days, RISK_SLA_DAYS_CAP[risk]);
}

export function computeSlaDeadline(
  createdAt: string,
  categoryDays: number,
  riskLevel: string | null | undefined
): string {
  const days = computeResolutionSlaDays(categoryDays, riskLevel);
  const deadline = new Date(createdAt);
  deadline.setUTCDate(deadline.getUTCDate() + days);
  return deadline.toISOString();
}

export function getSlaStatus(ticket: Ticket, now = new Date()): SlaStatus {
  if (!ticket.sla_deadline) return 'on_track';

  const deadline = new Date(ticket.sla_deadline);
  const created = new Date(ticket.created_at);
  const totalMs = deadline.getTime() - created.getTime();

  if (ticket.status === 'Resolved') {
    const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at) : now;
    return resolvedAt.getTime() <= deadline.getTime() ? 'met' : 'breached';
  }

  const remainingMs = deadline.getTime() - now.getTime();
  if (remainingMs <= 0) return 'breached';
  if (totalMs > 0 && remainingMs / totalMs <= WARNING_THRESHOLD) return 'warning';
  return 'on_track';
}

export function getSlaLabel(status: SlaStatus): string {
  const labels: Record<SlaStatus, string> = {
    on_track: 'En tiempo',
    warning: 'Advertencia',
    breached: 'Vencido',
    met: 'Cumplido',
  };
  return labels[status];
}

export function getRemainingTime(
  deadline: string,
  now = new Date()
): { days: number; hours: number; overdue: boolean } {
  const ms = new Date(deadline).getTime() - now.getTime();
  const overdue = ms < 0;
  const absMs = Math.abs(ms);
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, overdue };
}

export function formatSlaRemaining(ticket: Ticket): string {
  if (!ticket.sla_deadline) return '';
  const { days, hours, overdue } = getRemainingTime(ticket.sla_deadline);
  if (overdue) {
    if (days > 0) return `Vencido hace ${days}d ${hours}h`;
    return `Vencido hace ${hours}h`;
  }
  if (days > 0) return `Vence en ${days}d ${hours}h`;
  return `Vence en ${hours}h`;
}

export const SLA_STATUS_ORDER: Record<SlaStatus, number> = {
  breached: 0,
  warning: 1,
  on_track: 2,
  met: 3,
};
