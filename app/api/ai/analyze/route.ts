import { z } from 'zod';
import { createClient } from '@/src/lib/supabase/server';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile, canAccessAgent } from '@/src/lib/auth';
import { analyzeTicket, mapRiskToPriority } from '@/src/services/aiService';
import { triggerN8nWebhook } from '@/src/lib/n8n';
import { recordHighPriorityNotifications } from '@/src/services/notificationService';
import { log } from '@/src/lib/logger';

const bodySchema = z.object({ ticketId: z.string().uuid(), applyPriority: z.boolean().optional() });

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAgent(profile.role)) return jsonError('Solo agentes o administradores', 403);
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return jsonError('ticketId requerido', 400);
  const supabase = await createClient();
  const { data: ticket, error: ticketError } = await supabase.from('tickets').select('*, categories(name)').eq('id', parsed.data.ticketId).single();
  if (ticketError || !ticket) return jsonError('Ticket no encontrado', 404);
  const { data: comments } = await supabase.from('comments').select('message').eq('ticket_id', parsed.data.ticketId).order('created_at');
  try {
    const categoryName = ticket.categories && typeof ticket.categories === 'object' && 'name' in ticket.categories ? (ticket.categories as { name: string }).name : undefined;
    const { result, prompt, latencyMs, modelVersion } = await analyzeTicket({
      title: ticket.title,
      description: ticket.description,
      categoryName,
      comments: (comments ?? []).map((c) => c.message),
    });
    await supabase.from('ai_logs').insert({
      ticket_id: parsed.data.ticketId,
      prompt,
      model_version: modelVersion,
      latency_ms: latencyMs,
      response_json: result as unknown as Record<string, unknown>,
    });
    const updatePayload: Record<string, string> = {
      ai_summary: result.summary,
      ai_classification: result.classification,
      ai_suggestions: result.suggestions,
      ai_risk_level: result.riskLevel,
      ai_sentiment: result.sentiment,
    };
    if (parsed.data.applyPriority) updatePayload.priority = mapRiskToPriority(result.riskLevel);
    const { data: updated } = await supabase.from('tickets').update(updatePayload).eq('id', parsed.data.ticketId).select('*').single();
    if (result.riskLevel === 'high' || updated?.priority === 'High' || updated?.priority === 'Urgent') {
      const n8nResult = await triggerN8nWebhook('N8N_WEBHOOK_HIGH_PRIORITY', {
        event: 'ticket.ai_high_risk',
        ticketId: parsed.data.ticketId,
        title: ticket.title,
        riskLevel: result.riskLevel,
        priority: updated?.priority,
      });
      await recordHighPriorityNotifications({
        ticketId: parsed.data.ticketId,
        ticketTitle: ticket.title,
        ownerId: ticket.user_id,
        event: 'ticket.ai_high_risk',
        priority: updated?.priority,
        riskLevel: result.riskLevel,
        n8nResult,
      });
    }
    return jsonOk({ analysis: result, ticket: updated, latencyMs, modelVersion });
  } catch (err) {
    log('error', 'AI analyze failed', { ticketId: parsed.data.ticketId, error: err instanceof Error ? err.message : 'unknown' });
    return jsonError(err instanceof Error ? err.message : 'Error de IA', 500, 'AI_ERROR');
  }
}
