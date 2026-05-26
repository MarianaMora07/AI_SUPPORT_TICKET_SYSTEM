import { z } from 'zod';

export const aiAnalysisSchema = z.object({
  summary: z.string().min(1),
  classification: z.string().min(1),
  suggestions: z.string().min(1),
  riskLevel: z.enum(['low', 'medium', 'high']),
  recommendedAction: z.enum(['assign', 'escalate', 'close', 'request_info']).optional(),
});

export type AiAnalysisResult = z.infer<typeof aiAnalysisSchema>;
