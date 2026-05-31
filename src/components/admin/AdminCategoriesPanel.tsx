'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import type { Category } from '@/src/types/database';

export function AdminCategoriesPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  function load() {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSla(id: string, resolution_sla_days: number) {
    const res = await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolution_sla_days }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('SLA de categoría actualizado');
      load();
    } else {
      setMessage(data.error ?? 'Error al guardar');
    }
  }

  if (loading) return <p>Cargando categorías…</p>;

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Define el plazo base de resolución por categoría. El riesgo IA (al analizar manualmente) puede acortar el plazo: alto 7d, medio 14d, bajo 30d.
      </p>
      {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-100 bg-brand-50">
            <tr>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Días SLA</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <CategoryRow key={c.id} category={c} onSave={saveSla} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  onSave,
}: {
  category: Category;
  onSave: (id: string, days: number) => void;
}) {
  const [days, setDays] = useState(String(category.resolution_sla_days ?? 14));

  return (
    <tr className="border-b border-brand-50">
      <td className="px-4 py-3 font-medium">{category.name}</td>
      <td className="px-4 py-3 text-muted">{category.description ?? '—'}</td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={1}
          max={90}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-20 rounded-lg border border-border px-2 py-1"
        />
      </td>
      <td className="px-4 py-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const n = parseInt(days, 10);
            if (n >= 1 && n <= 90) onSave(category.id, n);
          }}
        >
          Guardar
        </Button>
      </td>
    </tr>
  );
}
