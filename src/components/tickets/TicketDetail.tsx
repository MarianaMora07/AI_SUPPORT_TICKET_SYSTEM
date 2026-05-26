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

  const load = useCallback(async () => {
    const [tRes, cRes] = await Promise.all([
      fetch(`/api/tickets/${ticketId}`),
      fetch(`/api/tickets/${ticketId}/comments`),
    ]);
    const tData = await tRes.json();
    const cData = await cRes.json();
    if (tRes.ok) {
      setTicket(tData);
      // Aplicamos el formateador aquí para limpiar los corchetes de la BD
      setSuggestionDraft(formatAiSuggestions(tData.ai_suggestions));
    }
    if (cRes.ok) setComments(cData);
    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);

    const interval = setInterval(load, 15000);

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
    const data = await res.json();
    if (res.ok) setTicket(data);
    else setError(data.error);
  }

  async function addComment() {
    if (!message.trim()) return;
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
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
      const data = await res.json();
      setAiLoading(false);
      
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
    await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: suggestionDraft, is_internal: false }),
    });
    load();
  }

  if (loading) return <p className="text-zinc-500">Cargando…</p>;
  if (!ticket) return <p className="text-red-600">Ticket no encontrado</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {ticket.title}
          </h1>
          <p className="mt-4 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {ticket.description}
          </p>

          {isAgent && (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
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

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold">Comentarios</h2>
          <ul className="mb-4 space-y-3">
            {comments.length === 0 && (
              <p className="text-sm text-zinc-500">Sin comentarios aún.</p>
            )}
            {comments.map((c) => (
              <li
                key={c.id}
                className={`rounded-lg p-3 text-sm ${
                  c.is_internal
                    ? "bg-amber-50 dark:bg-amber-950/30"
                    : "bg-zinc-50 dark:bg-zinc-800"
                }`}
              >
                <p className="font-medium text-zinc-700 dark:text-zinc-300">
                  {(c.users as { full_name?: string })?.full_name ?? "Usuario"}
                  {c.is_internal && " · Nota interna"}
                </p>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
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
              <label className="flex items-center gap-2 text-sm text-zinc-600">
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
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
            <h2 className="mb-3 font-semibold text-indigo-900 dark:text-indigo-200">
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
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    Resumen
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {ticket.ai_summary}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Clasificación</p>
                  <p className="text-zinc-600">{ticket.ai_classification}</p>
                </div>
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
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-medium">Estado del análisis</p>
            <p className="mt-2 text-zinc-600">{ticket.ai_summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
