"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge, PriorityBadge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Label, Select, Textarea } from "@/src/components/ui/Input";
import type {
  Comment,
  Ticket,
  TicketPriority,
  TicketStatus,
  UserRole,
} from "@/src/types/database";
import { readJsonResponse } from "@/src/lib/fetch-json";

const ticketCommentsApi = (ticketId: string) => `/api/ticket-comments/${ticketId}`;

function isApiError(value: unknown): value is { error: string } {
  return !!value && typeof value === "object" && "error" in value;
}

function isTicket(value: unknown): value is Ticket {
  return !!value && typeof value === "object" && "id" in value && "title" in value;
}

const formatAiSuggestions = (suggestions: unknown): string => {
  if (!suggestions) return '';
  
  // Array.isArray sirve como type guard nativo para 'unknown'
  if (Array.isArray(suggestions)) {
    return suggestions.join('\n');
  }
  
  // El typeof también reduce el tipo de 'unknown' a 'string' de forma segura
  if (typeof suggestions === 'string') {
    const trimmed = suggestions.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.join('\n');
        }
      } catch (e) {
        // Si falla el parseo, continúa abajo como string normal
      }
    }
    return trimmed;
  }
  
  return String(suggestions);
};

export function TicketDetail({
  ticketId,
  role,
}: {
  ticketId: string;
  role: UserRole;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestionDraft, setSuggestionDraft] = useState("");
  const [error, setError] = useState("");

  const isAgent = role === "Agent" || role === "Admin";

  const load = useCallback(async (options?: { syncSuggestion?: boolean }) => {
    const syncSuggestion = options?.syncSuggestion ?? false;
    try {
      const [tRes, cRes] = await Promise.all([
        fetch(`/api/tickets/${ticketId}`),
        fetch(ticketCommentsApi(ticketId)),
      ]);
      const tData = await readJsonResponse<Ticket | { error?: string }>(tRes);
      const cData = await readJsonResponse<Comment[] | { error?: string }>(cRes);

      if (tRes.ok && isTicket(tData)) {
        setTicket(tData);
        if (syncSuggestion) {
          setSuggestionDraft(formatAiSuggestions(tData.ai_suggestions));
        }
      } else if (!tRes.ok) {
        setTicket(null);
        setError(isApiError(tData) ? tData.error : `No se pudo cargar el ticket (${tRes.status})`);
      }

      if (cRes.ok && Array.isArray(cData)) {
        setComments(cData);
      } else if (!cRes.ok) {
        setComments([]);
        if (tRes.ok) {
          setError(
            (prev) =>
              prev ||
              (isApiError(cData) ? cData.error : `No se pudieron cargar los comentarios (${cRes.status})`)
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el ticket");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load({ syncSuggestion: true });
    }, 0);

    const interval = setInterval(() => load(), 15000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [load]);

  async function updateTicket(patch: Partial<Ticket>) {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await readJsonResponse<Ticket | { error?: string }>(res);
    if (res.ok && isTicket(data)) setTicket(data);
    else setError(isApiError(data) ? data.error : `Error al actualizar (${res.status})`);
  }

  async function addComment() {
    if (!message.trim()) return;
    const res = await fetch(ticketCommentsApi(ticketId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, is_internal: isInternal }),
    });
    if (res.ok) {
      setMessage("");
      load();
    }
  }

async function runAiAnalysis(applyPriority: boolean) {
    setAiLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, applyPriority }),
      });

      // 🌟 PRIMERO validamos si el servidor respondió bien. 
      // Si dio error (500, 503, etc.), leemos la respuesta como texto plano para no romper el JSON.parse
      if (!res.ok) {
        const textError = await res.text();
        setAiLoading(false);
        // Si es un HTML largo de Next.js, extraemos un pedazo legible
        setError(`Error del servidor (${res.status}): ${textError.slice(0, 100)}...`);
        return;
      }

      // Si todo está bien, ahora sí parseamos el JSON con total confianza
      const data = await readJsonResponse<{
        ticket?: Ticket;
        analysis?: { suggestions?: unknown };
        error?: string;
      }>(res);
      setAiLoading(false);

      if (!data?.ticket || !data.analysis) {
        setError(data?.error ?? "Respuesta de IA inválida");
        return;
      }

      setTicket(data.ticket);
      setSuggestionDraft(formatAiSuggestions(data.analysis.suggestions));
      load();
      
    } catch (err) {
      setAiLoading(false);
      setError(err instanceof Error ? err.message : 'Error inesperado de red');
    }
  }

  async function applySuggestionAsComment() {
    if (!suggestionDraft.trim()) return;
    const res = await fetch(ticketCommentsApi(ticketId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: suggestionDraft, is_internal: false }),
    });
    if (!res.ok) {
      const data = await readJsonResponse<{ error?: string }>(res);
      setError(data?.error ?? `No se pudo publicar el comentario (${res.status})`);
      return;
    }
    setSuggestionDraft("");
    setError("");
    load();
  }

  if (loading) return <p className="text-muted">Cargando…</p>;
  if (!ticket) return <p className="text-red-600">Ticket no encontrado</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="text-2xl font-bold text-brand-900">
            {ticket.title}
          </h1>
          <p className="mt-4 whitespace-pre-wrap text-muted">
            {ticket.description}
          </p>

          {isAgent && (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-6">
              <div>
                <Label>Estado</Label>
                <Select
                  value={ticket.status}
                  onChange={(e) =>
                    updateTicket({ status: e.target.value as TicketStatus })
                  }
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </Select>
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select
                  value={ticket.priority}
                  onChange={(e) =>
                    updateTicket({ priority: e.target.value as TicketPriority })
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">Comentarios</h2>
          <ul className="mb-4 space-y-3">
            {comments.length === 0 && (
              <p className="text-sm text-muted">Sin comentarios aún.</p>
            )}
            {comments.map((c) => (
              <li
                key={c.id}
                className={`rounded-lg p-3 text-sm ${
                  c.is_internal
                    ? "bg-amber-50"
                    : "bg-brand-50"
                }`}
              >
                <p className="font-medium text-brand-900">
                  {(c.users as { full_name?: string })?.full_name ?? "Usuario"}
                  {c.is_internal && " · Nota interna"}
                </p>
                <p className="mt-1 text-muted">
                  {c.message}
                </p>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <Textarea
              rows={3}
              placeholder="Escribe un comentario…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {isAgent && (
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                />
                Nota interna (solo agentes)
              </label>
            )}
            <Button type="button" onClick={addComment}>
              Enviar comentario
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {isAgent && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <h2 className="mb-3 font-semibold text-brand-800">
              Asistente IA
            </h2>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={aiLoading}
                onClick={() => runAiAnalysis(false)}
              >
                {aiLoading ? "Analizando…" : "Resumir y sugerir"}
              </Button>
              <Button
                type="button"
                disabled={aiLoading}
                onClick={() => runAiAnalysis(true)}
              >
                Analizar y aplicar prioridad
              </Button>
            </div>

            {ticket.ai_summary && (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-medium text-brand-900">
                    Resumen
                  </p>
                  <p className="text-muted">
                    {ticket.ai_summary}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Clasificación</p>
                  <p className="text-muted">{ticket.ai_classification}</p>
                </div>
                {ticket.ai_sentiment && (
                  <p>
                    Sentimiento: <strong>{ticket.ai_sentiment}</strong>
                  </p>
                )}
                {ticket.ai_risk_level && (
                  <p>
                    Riesgo: <strong>{ticket.ai_risk_level}</strong>
                  </p>
                )}
              </div>
            )}

            <div className="mt-4">
              <Label>Sugerencia de respuesta (editable)</Label>
              <Textarea
                rows={5}
                className="mt-1"
                value={suggestionDraft}
                onChange={(e) => setSuggestionDraft(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-2 w-full"
                onClick={applySuggestionAsComment}
              >
                Aprobar y publicar como comentario
              </Button>
            </div>
          </div>
        )}

        {!isAgent && ticket.ai_summary && (
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm shadow-sm">
            <p className="font-medium">Estado del análisis</p>
            <p className="mt-2 text-muted">{ticket.ai_summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
