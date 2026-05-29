import type { Ticket, TicketPriority } from '@/src/types/database';

/** Menor valor = más prioritario (Urgent primero). */
export const PRIORITY_ORDER: Record<TicketPriority, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const RISK_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function priorityRank(priority: TicketPriority | null | undefined): number {
  if (!priority) return PRIORITY_ORDER.Medium;
  return PRIORITY_ORDER[priority] ?? PRIORITY_ORDER.Medium;
}

function riskRank(risk: string | null | undefined): number {
  if (!risk) return RISK_ORDER.medium;
  return RISK_ORDER[risk.toLowerCase()] ?? RISK_ORDER.medium;
}

/**
 * Cola de tickets: mayor prioridad primero (Urgent → Low).
 * Si empatan en prioridad, mayor riesgo IA (high → low) cuando hay clasificación.
 * Desempate final: más recientes primero.
 */
export function compareTicketsByPriority(a: Ticket, b: Ticket): number {
  const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
  if (byPriority !== 0) return byPriority;

  const aClassified = Boolean(a.ai_classification);
  const bClassified = Boolean(b.ai_classification);
  if (aClassified && bClassified) {
    const byRisk = riskRank(a.ai_risk_level) - riskRank(b.ai_risk_level);
    if (byRisk !== 0) return byRisk;
  }

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function sortTicketsByPriority(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort(compareTicketsByPriority);
}
