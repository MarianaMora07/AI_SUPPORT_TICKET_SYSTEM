'use client';

import { useState } from 'react';
import { authService } from '@/src/services/authService';
import { Button } from '@/src/components/ui/Button';
import { Input, Label } from '@/src/components/ui/Input';

export function ProfileSettingsForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoadingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo actualizar el perfil');
      setMessage('Nombre actualizado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil');
    } finally {
      setLoadingProfile(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoadingPassword(true);
    try {
      await authService.updatePassword(password);
      setPassword('');
      setConfirmPassword('');
      setMessage('Contraseña actualizada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar contraseña');
    } finally {
      setLoadingPassword(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={updateProfile}
        className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Perfil</p>
        <h2 className="mt-1 text-xl font-bold text-brand-900">Datos de registro</h2>
        <p className="mt-2 text-sm text-muted">
          Puedes mantener actualizado tu nombre visible dentro del sistema.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="email">Correo</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div>
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loadingProfile}>
            {loadingProfile ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      <form
        onSubmit={updatePassword}
        className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Seguridad</p>
        <h2 className="mt-1 text-xl font-bold text-brand-900">Cambiar contraseña</h2>
        <p className="mt-2 text-sm text-muted">
          Define una nueva contraseña para tu acceso.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={loadingPassword}>
            {loadingPassword ? 'Actualizando…' : 'Actualizar contraseña'}
          </Button>
        </div>
      </form>

      {(error || message) && (
        <div className="lg:col-span-2">
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        </div>
      )}
    </div>
  );
}
