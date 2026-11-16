'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLMS } from '@/context/LMSContext';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Crown,
  GraduationCap,
  Layers,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';

export default function WhiteLabelLoginPage() {
  const router = useRouter();
  const {
    tenants,
    currentTenant,
    users,
    selectTenantById,
    loginAsRole,
    loginWithCredentials,
  } = useLMS();

  const [email, setEmail] = useState('laura.gomez@agencia.co');
  const [password, setPassword] = useState('••••••••••••');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const tenantStudents = users.filter(
    (u) => u.tenant_id === currentTenant.id && u.role === 'student'
  );
  const tenantAdmin = users.find(
    (u) => u.tenant_id === currentTenant.id && u.role === 'reseller_admin'
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginWithCredentials(email);
    setFeedback(res);
    if (res.ok) {
      setTimeout(() => {
        if (res.role === 'superadmin') router.push('/superadmin');
        else if (res.role === 'reseller_admin') router.push('/reseller');
        else router.push('/student');
      }, 500);
    }
  };

  const handleQuickRoleAccess = (role: 'superadmin' | 'reseller_admin' | 'student') => {
    loginAsRole(role, currentTenant.id);
    if (role === 'superadmin') router.push('/superadmin');
    if (role === 'reseller_admin') router.push('/reseller');
    if (role === 'student') router.push('/student');
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-slate-950 px-4 py-12">
      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-12">
        {/* Columna Izquierda: Tarjeta de Login Marca Blanca del Reseller */}
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl">
            {/* Banda Superior con el Color Primario del Tenant */}
            <div
              className="px-8 py-7 text-white"
              style={{
                background: `linear-gradient(135deg, ${currentTenant.primary_color}, #0f172a)`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                    Portal de Acceso Marca Blanca
                  </span>
                  <h1 className="text-2xl font-extrabold text-white">
                    {currentTenant.name}
                  </h1>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/85">
                Dominio activo:{' '}
                <strong>
                  {currentTenant.custom_domain || `${currentTenant.slug}.plataformalms.com`}
                </strong>
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5 p-8">
              {feedback && (
                <div
                  className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                    feedback.ok
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  }`}
                >
                  {feedback.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Correo Electrónico
                </label>
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="alumno@empresa.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Contraseña
                </label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-95"
                style={{ backgroundColor: currentTenant.primary_color }}
              >
                Iniciar Sesión en {currentTenant.name}
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  Protegido por <strong>Control de Sesión Única</strong>: iniciar sesión aquí
                  cerrará cualquier sesión abierta en otros dispositivos.
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Panel de Prueba Rápida de Cuentas y Academias */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-base font-bold text-white">
              1. Cambia de Academia para probar el Login Marca Blanca
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Selecciona otra academia y observa cómo el formulario de acceso adopta su marca al instante:
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {tenants.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTenantById(t.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    t.id === currentTenant.id
                      ? 'border-white/40 bg-slate-800'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.primary_color }}
                    />
                    <span className="truncate text-xs font-bold text-white">{t.name}</span>
                  </div>
                  <div className="mt-1 truncate text-[11px] text-slate-400">
                    {t.custom_domain || `${t.slug}.lms.com`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-base font-bold text-white">
              2. Acceso Directo en 1 Clic (Para tus pruebas por Rol)
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Entra directamente a cualquiera de los 3 paneles o haz clic en un correo para probar el login:
            </p>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => handleQuickRoleAccess('superadmin')}
                className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left transition hover:bg-amber-500/20"
              >
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-amber-400" />
                  <div>
                    <div className="text-sm font-bold text-white">
                      Entrar como SuperAdmin (Dueño del SaaS)
                    </div>
                    <div className="text-xs text-amber-200/80">
                      ceo@plataformalms.com • Crea academias y asigna paquetes de licencias
                    </div>
                  </div>
                </div>
                <span className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950">
                  Abrir Panel
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleAccess('reseller_admin')}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-left transition hover:bg-emerald-500/20"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                  <div>
                    <div className="text-sm font-bold text-white">
                      Entrar como Reseller Admin ({currentTenant.name})
                    </div>
                    <div className="text-xs text-emerald-200/80">
                      {tenantAdmin?.email} • Personaliza marca y gestiona {currentTenant.used_licenses}/{currentTenant.max_licenses} licencias
                    </div>
                  </div>
                </div>
                <span className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-slate-950">
                  Abrir Panel
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleAccess('student')}
                className="flex w-full items-center justify-between rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-left transition hover:bg-sky-500/20"
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-sky-400" />
                  <div>
                    <div className="text-sm font-bold text-white">
                      Entrar como Alumno Activo ({currentTenant.name})
                    </div>
                    <div className="text-xs text-sky-200/80">
                      Reproduce clases y prueba el bloqueo de sesión simultánea
                    </div>
                  </div>
                </div>
                <span className="rounded-lg bg-sky-500 px-2.5 py-1 text-xs font-bold text-slate-950">
                  Abrir Aula
                </span>
              </button>
            </div>

            {/* Lista de Alumnos de esta Academia para probar Login de Activos vs Inactivos */}
            <div className="mt-5 border-t border-slate-800 pt-4">
              <div className="text-xs font-semibold text-slate-300">
                Probar correo en el formulario ({currentTenant.name}):
              </div>
              <div className="mt-2 space-y-1.5">
                {tenantStudents.map((stu) => (
                  <button
                    key={stu.id}
                    type="button"
                    onClick={() => {
                      setEmail(stu.email);
                      setFeedback(null);
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-3 py-2 text-xs hover:border-slate-700"
                  >
                    <span className="text-slate-200">
                      {stu.full_name} (<span className="text-slate-400">{stu.email}</span>)
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        stu.is_active
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {stu.is_active ? 'Licencia Activa' : 'Inactivo (Bloqueado)'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
