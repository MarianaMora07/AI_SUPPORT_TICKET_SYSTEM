import { z } from 'zod';

/** Convierte strings, arrays u objetos que devuelve Gemini en texto plano. */
export function coerceAiText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(coerceAiText).filter(Boolean).join('\n');
        }
      } catch {
        /* usar el string tal cual */
      }
    }
    return trimmed;
  }
  if (Array.isArray(value)) {
    return value.map(coerceAiText).filter(Boolean).join('\n');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text.trim();
    if (typeof record.message === 'string') return record.message.trim();
    return Object.values(record).map(coerceAiText).filter(Boolean).join('\n');
  }
  return String(value).trim();
}

export function coerceRiskLevel(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const key = value.toLowerCase().trim();
  const map: Record<string, 'low' | 'medium' | 'high'> = {
    low: 'low',
    bajo: 'low',
    medium: 'medium',
    medio: 'medium',
    high: 'high',
    alto: 'high',
    urgent: 'high',
    urgente: 'high',
    critical: 'high',
    critico: 'high',
    crítico: 'high',
  };
  return map[key] ?? key;
}

export function coerceSentiment(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const key = value.toLowerCase().trim();
  const map: Record<string, 'positive' | 'neutral' | 'negative' | 'frustrated'> = {
    positive: 'positive',
    positivo: 'positive',
    neutral: 'neutral',
    neutro: 'neutral',
    negative: 'negative',
    negativo: 'negative',
    frustrated: 'frustrated',
    frustrado: 'frustrated',
    angry: 'frustrated',
    enojado: 'frustrated',
    urgent: 'frustrated',
    urgente: 'frustrated',
  };
  return map[key] ?? key;
}

export function coerceRecommendedAction(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const key = value.toLowerCase().trim().replace(/\s+/g, '_');
  const map: Record<string, 'assign' | 'escalate' | 'close' | 'request_info'> = {
    assign: 'assign',
    asignar: 'assign',
    escalate: 'escalate',
    escalar: 'escalate',
    close: 'close',
    cerrar: 'close',
    request_info: 'request_info',
    solicitar_info: 'request_info',
    'request-info': 'request_info',
  };
  return map[key] ?? key;
}

/** Normaliza la respuesta cruda de Gemini antes de validar con Zod. */
export function normalizeAiPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('La IA no devolvió un objeto JSON');
  }
  const src = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {
    summary: coerceAiText(src.summary),
    classification: coerceAiText(src.classification),
    suggestions: coerceAiText(src.suggestions),
    riskLevel: coerceRiskLevel(src.riskLevel),
    sentiment: coerceSentiment(src.sentiment),
  };
  if (src.recommendedAction != null && src.recommendedAction !== '') {
    normalized.recommendedAction = coerceRecommendedAction(src.recommendedAction);
  }
  return normalized;
}

export const aiAnalysisSchema = z.object({
  summary: z.string().min(1),
  classification: z.string().min(1),
  suggestions: z.string().min(1),
  riskLevel: z.enum(['low', 'medium', 'high']),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'frustrated']),
  recommendedAction: z.enum(['assign', 'escalate', 'close', 'request_info']).optional(),
});

export type AiAnalysisResult = z.infer<typeof aiAnalysisSchema>;

/** Esquema para `responseSchema` de la API REST de Gemini. */
export const geminiAiResponseSchema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: 'Resumen breve del ticket' },
    classification: { type: 'STRING', description: 'Categoría o tipo del incidente' },
    suggestions: {
      type: 'STRING',
      description: 'Sugerencias de respuesta en texto plano, una por línea si hay varias',
    },
    riskLevel: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    sentiment: {
      type: 'STRING',
      enum: ['positive', 'neutral', 'negative', 'frustrated'],
      description: 'Tono emocional del usuario en el ticket',
    },
    recommendedAction: {
      type: 'STRING',
      enum: ['assign', 'escalate', 'close', 'request_info'],
    },
  },
  required: ['summary', 'classification', 'suggestions', 'riskLevel', 'sentiment'],
} as const;
