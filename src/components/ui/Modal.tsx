'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/src/components/ui/Button';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-[min(calc(100vw-2rem),28rem)] max-h-[90dvh] overflow-hidden rounded-2xl border border-border bg-surface p-0 shadow-2xl backdrop:bg-black/40"
      onClose={onClose}
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-brand-900">{title}</h2>
      </div>
      <div className="max-h-[60dvh] overflow-y-auto px-5 py-4 text-sm text-muted break-words">{children}</div>
      <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
        {footer ?? (
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </div>
    </dialog>
  );
}
