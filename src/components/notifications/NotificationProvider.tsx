'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/src/components/ui/Modal';
import { Button } from '@/src/components/ui/Button';
import type { Notification } from '@/src/types/database';

const MODAL_KINDS = new Set([
  'status_change',
  'new_comment',
  'comment_on_resolved',
]);

export function NotificationProvider() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openPanel, setOpenPanel] = useState(false);
  const [modalNotification, setModalNotification] = useState<Notification | null>(null);
  const shownModalIdsRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    if (!res.ok || !data.notifications) return;
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount ?? 0);

    const unreadImportant = (data.notifications as Notification[]).find(
      (n) => !n.is_read && MODAL_KINDS.has(n.kind) && !shownModalIdsRef.current.has(n.id)
    );
    if (unreadImportant) {
      shownModalIdsRef.current.add(unreadImportant.id);
      setModalNotification(unreadImportant);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!openPanel) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPanel]);

  async function markRead(ids: string[]) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    load();
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    load();
  }

  async function closeModal() {
    if (modalNotification) {
      await markRead([modalNotification.id]);
    }
    setModalNotification(null);
  }

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpenPanel((v) => !v)}
          className="relative rounded-lg p-2 text-muted transition hover:bg-brand-50 hover:text-brand-700"
          aria-label="Notificaciones"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {openPanel && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/20 sm:hidden"
              aria-label="Cerrar notificaciones"
              onClick={() => setOpenPanel(false)}
            />
            <div className="fixed inset-x-4 top-[4.25rem] z-50 flex max-h-[min(28rem,calc(100dvh-5.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:w-80">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
                <p className="font-semibold text-brand-900">Notificaciones</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="shrink-0 text-xs text-brand-600 hover:underline"
                    onClick={markAllRead}
                  >
                    Marcar todas leídas
                  </button>
                )}
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {notifications.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-muted">Sin alertas</li>
                )}
                {notifications.slice(0, 15).map((n) => (
                  <li
                    key={n.id}
                    className={`border-b border-border px-4 py-3 text-sm last:border-b-0 ${n.is_read ? 'opacity-60' : ''}`}
                  >
                    <p className="break-words font-medium text-brand-900">{n.title ?? 'Notificación'}</p>
                    <p className="mt-1 break-words text-muted">{n.message}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                    {n.ticket_id && (
                      <Link
                        href={`/tickets/${n.ticket_id}`}
                        className="text-xs font-medium text-brand-600 hover:underline"
                        onClick={() => !n.is_read && markRead([n.id])}
                      >
                        Ver ticket
                      </Link>
                    )}
                    {!n.is_read && (
                      <button type="button" className="text-xs text-muted hover:underline" onClick={() => markRead([n.id])}>
                        Marcar leída
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          </>
        )}
      </div>

      <Modal
        open={!!modalNotification}
        onClose={() => void closeModal()}
        title={modalNotification?.title ?? 'Nueva alerta'}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => void closeModal()}>
              Entendido
            </Button>
            {modalNotification?.ticket_id && (
              <Link href={`/tickets/${modalNotification.ticket_id}`} onClick={() => void closeModal()}>
                <Button type="button">Ver ticket</Button>
              </Link>
            )}
          </>
        }
      >
        <p>{modalNotification?.message}</p>
      </Modal>
    </>
  );
}
