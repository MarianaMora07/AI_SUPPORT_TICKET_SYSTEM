import { z } from 'zod';
import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile, canAccessAgent } from '@/src/lib/auth';
import { log } from '@/src/lib/logger';
import { analyzeTicketFull } from '@/src/services/ticketAiService';

const bodySchema = z.object({ ticketId: z.string().uuid(), applyPriority: z.boolean().optional() });

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !canAccessAgent(profile.role)) return jsonError('Solo agentes o administradores', 403);
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return jsonError('ticketId requerido', 400);

  try {
    const { analysis, ticket, latencyMs, modelVersion } = await analyzeTicketFull(
      parsed.data.ticketId,
      parsed.data.applyPriority ?? false
    );
    return jsonOk({ analysis, ticket, latencyMs, modelVersion });
  } catch (err) {
    log('error', 'AI analyze failed', {
      ticketId: parsed.data.ticketId,
      error: err instanceof Error ? err.message : 'unknown',
    });
    return jsonError(err instanceof Error ? err.message : 'Error de IA', 500, 'AI_ERROR');
  }
}
