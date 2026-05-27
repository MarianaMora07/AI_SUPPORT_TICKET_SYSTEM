'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import { Select } from '@/src/components/ui/Input';
import type { User, UserRole } from '@/src/types/database';

export function AdminUsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  function load() {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function updateRole(userId: string, role: UserRole) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Rol actualizado');
      load();
    } else {
      setMessage(data.error ?? 'Error');
    }
  }

  if (loading) return <p>Cargando usuarios…</p>;

  return (
    <div>
      {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-100 bg-brand-50">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} onSave={updateRole} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  onSave,
}: {
  user: User;
  onSave: (id: string, role: UserRole) => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);

  return (
    <tr className="border-b border-brand-50">
      <td className="px-4 py-3">{user.email}</td>
      <td className="px-4 py-3">{user.full_name}</td>
      <td className="px-4 py-3">
        <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          <option value="User">User</option>
          <option value="Agent">Agent</option>
          <option value="Admin">Admin</option>
        </Select>
      </td>
      <td className="px-4 py-3">
        <Button type="button" variant="secondary" onClick={() => onSave(user.id, role)}>
          Guardar
        </Button>
      </td>
    </tr>
  );
}
