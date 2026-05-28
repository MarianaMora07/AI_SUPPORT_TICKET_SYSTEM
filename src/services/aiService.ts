import OpenAI from 'openai';
import {
  aiAnalysisSchema,
  geminiAiResponseSchema,
  normalizeAiPayload,
  type AiAnalysisResult,
} from '../types/ai';

const OPENAI_MODEL = 'gpt-4o-mini';
const ANTHROPIC_MODEL = 'claude-3-5-haiku-latest';
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';

function buildPrompt(input: {
  title: string;
  description: string;
  categoryName?: string;
  comments: string[];
}): string {
  const commentsBlock =
    input.comments.length > 0 ? `\nComentarios:\n${input.comments.join('\n---\n')}` : '';
  
  return `Analiza el ticket de soporte de manera objetiva.
Para determinar el 'riskLevel', usa:
- 'high': Afecta a muchos usuarios, caída de servidores o fallas críticas.
- 'medium': Ralentiza el trabajo o fallas de herramientas secundarias.
- 'low': Dudas comunes, consultas individuales o pruebas.

Responde ÚNICAMENTE con un objeto JSON válido con estas llaves exactas (todos los valores deben ser strings, no arrays):
- summary: string
- classification: string
- suggestions: string (varias sugerencias separadas por saltos de línea, no un array)
- riskLevel: "low" | "medium" | "high"
- sentiment: "positive" | "neutral" | "negative" | "frustrated" (tono del usuario en título, descripción y comentarios)
- recommendedAction (opcional): "assign" | "escalate" | "close" | "request_info"

Título: ${input.title}
Categoría: ${input.categoryName ?? 'N/A'}
Descripción: ${input.description}${commentsBlock}`;
}

function parseAiJson(raw: string): AiAnalysisResult {
  // Extractor universal por si Gemini decora la respuesta con texto o markdown
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  
  let cleanJson = raw;
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanJson = raw.substring(firstBrace, lastBrace + 1);
  }

  let json: unknown;
  try {
    json = JSON.parse(cleanJson);
  } catch {
    throw new Error('La IA no devolvió JSON válido');
  }

  let normalized: Record<string, unknown>;
  try {
    normalized = normalizeAiPayload(json);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'La IA no devolvió JSON válido');
  }

  const parsed = aiAnalysisSchema.safeParse(normalized);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Formato IA inválido (${fields || 'campos desconocidos'})`);
  }
  return parsed.data;
}

// 🌟 NUEVA: Función para conectar con Gemini vía Fetch sin dependencias extra
async function analyzeWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta la variable GEMINI_API_KEY en el entorno');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: geminiAiResponseSchema,
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Error de la API de Gemini: ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Respuesta vacía de Gemini');

  return { raw, modelVersion: GEMINI_MODEL };
}

async function analyzeWithOpenAI(prompt: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: 'Asistente de soporte. Solo JSON.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Respuesta vacía de OpenAI');
  return { raw, modelVersion: OPENAI_MODEL };
}

async function analyzeWithAnthropic(prompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: 'Solo JSON válido.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const raw = data.content?.find((c) => c.type === 'text')?.text;
  if (!raw) throw new Error('Respuesta vacía de Anthropic');
  return { raw, modelVersion: ANTHROPIC_MODEL };
}

export async function analyzeTicket(input: {
  title: string;
  description: string;
  categoryName?: string;
  comments: string[];
}) {
  const prompt = buildPrompt(input);
  const start = Date.now();
  const provider = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase();

  let raw: string;
  let modelVersion: string;

  try {
    // 🌟 Enrutador corregido para soportar Gemini de forma nativa
    if (provider === 'gemini') {
      ({ raw, modelVersion } = await analyzeWithGemini(prompt));
    } else if (provider === 'anthropic') {
      ({ raw, modelVersion } = await analyzeWithAnthropic(prompt));
    } else {
      ({ raw, modelVersion } = await analyzeWithOpenAI(prompt));
    }
  } catch (firstError) {
    const msg = firstError instanceof Error ? firstError.message : '';
    
    // Fallback: Si Gemini o OpenAI fallan por saturación o región, intentamos Claude si hay KEY
    const isServiceFailure = msg.includes('503') || msg.includes('quota') || msg.includes('region') || msg.includes('demand');
    
    if (provider !== 'anthropic' && isServiceFailure && process.env.ANTHROPIC_API_KEY) {
      console.warn(`⚠️ Proveedor ${provider} falló. Activando fallback de emergencia con Anthropic.`);
      ({ raw, modelVersion } = await analyzeWithAnthropic(prompt));
    } else {
      throw firstError;
    }
  }

  return {
    result: parseAiJson(raw),
    prompt,
    latencyMs: Date.now() - start,
    modelVersion,
  };
}

export function mapRiskToPriority(risk: AiAnalysisResult['riskLevel']): 'Low' | 'Medium' | 'High' | 'Urgent' {
  if (risk === 'high') return 'Urgent';
  if (risk === 'medium') return 'High';
  return 'Medium';
}