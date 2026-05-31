import { createAdminClient } from '@/src/lib/supabase/admin';
import { log } from '@/src/lib/logger';
import { triggerN8nWebhook } from '@/src/lib/n8n';
import { analyzeTicket, assignTicketPriority, mapRiskToPriority } from '@/src/services/aiService';
import { recordHighPriorityNotifications } from '@/src/services/notificationService';
import { applySlaToTicket } from '@/src/services/slaService';
import type { Ticket } from '@/src/types/database';

function isAutoPriorityEnabled(): boolean {
  const flag = process.env.AI_AUTO_PRIORITY;
  return flag === undefined || flag === 'true' || flag === '1';
}

function categoryNameFromTicket(ticket: {
  categories?: { name: string } | { name: string }[] | null;
}): string | undefined {
  const cat = ticket.categories;
  if (!cat) return undefined;
  if (Array.isArray(cat)) return cat[0]?.name;
  if (typeof cat === 'object' && 'name' in cat) return cat.name;
  return undefined;
}

async function notifyHighPriority(input: {
  ticketId: string;
  title: string;
  ownerId: string;
  event: string;
  priority?: string;
  riskLevel?: string | null;
}) {
  const n8nResult = await triggerN8nWebhook('N8N_WEBHOOK_HIGH_PRIORITY', {
    event: input.event,
    ticketId: input.ticketId,
    title: input.title,
    priority: input.priority,
    riskLevel: input.riskLevel,
  });
  await recordHighPriorityNotifications({
    ticketId: input.ticketId,
    ticketTitle: input.title,
    ownerId: input.ownerId,
    event: input.event,
    priority: input.priority,
    riskLevel: input.riskLevel,
    n8nResult,
  });
}

export async function autoAssignPriority(ticketId: string): Promise<void> {
  if (!isAutoPriorityEnabled()) return;

  const admin = createAdminClient();
  const { data: ticket, error } = await admin
    .from('tickets')
    .select('*, categories(name)')
    .eq('id', ticketId)
    .single();

  if (error || !ticket) {
    log('error', 'Auto-priority: ticket not found', { ticketId });
    return;
  }

  try {
    const categoryName = categoryNameFromTicket(ticket);
    const { priority, reasoning, prompt, latencyMs, modelVersion } = await assignTicketPriority({
      title: ticket.title,
      description: ticket.description,
      categoryName,
    });

    await admin.from('ai_logs').insert({
      ticket_id: ticketId,
      prompt,
      model_version: modelVersion,
      latency_ms: latencyMs,
      response_json: { mode: 'auto_priority', priority, reasoning },
    });

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from('tickets')
      .update({
        priority,
        ai_priority_assigned_at: now,
      })
      .eq('id', ticketId)
      .select('*')
      .single();

    if (updateError || !updated) {
      log('error', 'Auto-priority: update failed', { ticketId, error: updateError?.message });
      return;
    }

    if (priority === 'High' || priority === 'Urgent') {
      await notifyHighPriority({
        ticketId,
        title: ticket.title,
        ownerId: ticket.user_id,
        event: 'ticket.auto_priority',
        priority,
      });
    }

    log('info', 'Auto-priority assigned', { ticketId, priority });
  } catch (err) {
    log('error', 'Auto-priority failed', {
      ticketId,
      error: err instanceof Error ? err.message : 'unknown',
    });
  }
}

export async function analyzeTicketFull(
  ticketId: string,
  applyPriority: boolean
): Promise<{ analysis: Awaited<ReturnType<typeof analyzeTicket>>['result']; ticket: Ticket; latencyMs: number; modelVersion: string }> {
  const admin = createAdminClient();
  const { data: ticket, error: ticketError } = await admin
    .from('tickets')
    .select('*, categories(name)')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) throw new Error('Ticket no encontrado');

  const { data: comments } = await admin
    .from('comments')
    .select('message')
    .eq('ticket_id', ticketId)
    .order('created_at');

  const categoryName = categoryNameFromTicket(ticket);
  const { result, prompt, latencyMs, modelVersion } = await analyzeTicket({
    title: ticket.title,
    description: ticket.description,
    categoryName,
    comments: (comments ?? []).map((c) => c.message),
  });

  await admin.from('ai_logs').insert({
    ticket_id: ticketId,
    prompt,
    model_version: modelVersion,
    latency_ms: latencyMs,
    response_json: result as unknown as Record<string, unknown>,
  });

  const now = new Date().toISOString();
  const updatePayload: Record<string, string> = {
    ai_summary: result.summary,
    ai_classification: result.classification,
    ai_suggestions: result.suggestions,
    ai_risk_level: result.riskLevel,
    ai_sentiment: result.sentiment,
    ai_analyzed_at: now,
  };
  if (applyPriority) updatePayload.priority = mapRiskToPriority(result.riskLevel);

  const { data: updated, error: updateError } = await admin
    .from('tickets')
    .update(updatePayload)
    .eq('id', ticketId)
    .select('*')
    .single();

  if (updateError || !updated) throw new Error(updateError?.message ?? 'Error al actualizar ticket');

  await applySlaToTicket(ticketId);

  const { data: finalTicket } = await admin.from('tickets').select('*').eq('id', ticketId).single();

  if (
    result.riskLevel === 'high' ||
    updated.priority === 'High' ||
    updated.priority === 'Urgent'
  ) {
    await notifyHighPriority({
      ticketId,
      title: ticket.title,
      ownerId: ticket.user_id,
      event: 'ticket.ai_high_risk',
      priority: updated.priority,
      riskLevel: result.riskLevel,
    });
  }

  return {
    analysis: result,
    ticket: (finalTicket ?? updated) as Ticket,
    latencyMs,
    modelVersion,
  };
}
