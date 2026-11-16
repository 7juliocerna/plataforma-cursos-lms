'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLMS } from '@/context/LMSContext';
import {
  Building2,
  Crown,
  Database,
  Eye,
  EyeOff,
  GraduationCap,
  Layers,
  LogIn,
  Palette,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export function WhiteLabelTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isSupabaseLive,
    tenants,
    currentTenant,
    currentUser,
    selectTenantById,
    loginAsRole,
    simulateConcurrentLoginFromOtherDevice,
    resetDemoData,
  } = useLMS();

  const isStudentRoute = pathname.startsWith('/student');
  const [hideSimulatorBar, setHideSimulatorBar] = useState(true);

  const handleRoleSwitch = (role: 'superadmin' | 'reseller_admin' | 'student') => {
    loginAsRole(role, currentTenant.id);
    if (role === 'superadmin') router.push('/superadmin');
    if (role === 'reseller_admin') router.push('/reseller');
    if (role === 'student') router.push('/student');
  };

  // Si estamos en /student y el modo "Vista Real Alumno" está activo (por defecto),
  // ocultamos la barra de arquitecto arriba y dejamos solo un botón flotante discreto abajo a la izquierda
  const showArchitectBar = !isStudentRoute || !hideSimulatorBar;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
        {showArchitectBar && (
          <div className="border-b border-slate-800/70 bg-slate-900/90 px-4 py-2 text-xs">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
              {/* Selector de Academia (Marca Blanca en Vivo) */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-1 font-medium text-indigo-300 ring-1 ring-indigo-500/30">
                  <Palette className="h-3.5 w-3.5" />
                  Academia Activa:
                </span>
                <select
                  aria-label="Seleccionar Academia o Reseller"
                  value={currentTenant.id}
                  onChange={(e) => selectTenantById(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-white shadow-sm focus:border-indigo-500 focus:outline-none"
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug}.lms.com • {tenant.used_licenses}/{tenant.max_licenses} licencias)
                    </option>
                  ))}
                </select>
              </div>

              {/* Conmutador Rápido de los 3 Roles + Estado Base de Datos */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400">Cambiar vista:</span>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('superadmin')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition ${
                    pathname.startsWith('/superadmin')
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Crown className="h-3.5 w-3.5" />
                  1. SuperAdmin
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('reseller_admin')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition ${
                    pathname.startsWith('/reseller')
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  2. Reseller
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('student')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition ${
                    pathname.startsWith('/student')
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  3. Alumno
                </button>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    isSupabaseLive
                      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
                  }`}
                >
                  <Database className="h-3 w-3" />
                  {isSupabaseLive ? 'Supabase Conectado' : 'Modo Demo'}
                </span>

                <button
                  type="button"
                  onClick={resetDemoData}
                  title="Restaurar datos originales"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>

                {isStudentRoute && (
                  <button
                    type="button"
                    onClick={() => setHideSimulatorBar(true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                  >
                    <EyeOff className="h-3 w-3" />
                    Ocultar barra admin
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cabecera Principal Marca Blanca de la Academia Seleccionada */}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5">
          <Link href={isStudentRoute ? '/student' : '/'} className="flex items-center gap-3 group">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-lg transition group-hover:scale-105"
              style={{ backgroundColor: currentTenant.primary_color }}
            >
              {currentTenant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentTenant.logo_url}
                  alt={currentTenant.name}
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <Layers className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  {currentTenant.name}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                  style={{ backgroundColor: currentTenant.primary_color }}
                >
                  Campus Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentTenant.custom_domain || `${currentTenant.slug}.plataformalms.com`}
              </p>
            </div>
          </Link>

          {/* Si está en modo Vista Real del Alumno, mostramos solo navegación limpia de Alumno */}
          {isStudentRoute && hideSimulatorBar ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:flex">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Licencia Activa • Sesión Única Protegida
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-1.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: currentTenant.primary_color }}
                >
                  {(currentUser?.full_name || 'Laura Gómez').charAt(0)}
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-white">
                    {currentUser?.full_name || 'Laura Gómez'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {currentUser?.email || 'laura.gomez@agencia.co'}
                  </div>
                </div>
              </div>

              <Link
                href="/login"
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Salir
              </Link>
            </div>
          ) : (
            /* Navegación completa cuando la barra de arquitecto está visible */
            <nav className="flex flex-wrap items-center gap-1.5 text-sm">
              <Link
                href="/"
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  pathname === '/'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                Landing Academia
              </Link>
              <Link
                href="/login"
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                  pathname === '/login'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                href="/superadmin"
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  pathname.startsWith('/superadmin')
                    ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                SuperAdmin
              </Link>
              <Link
                href="/reseller"
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  pathname.startsWith('/reseller')
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                Reseller
              </Link>
              <Link
                href="/student"
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold text-white shadow-sm transition hover:opacity-95"
                style={{ backgroundColor: currentTenant.primary_color }}
              >
                <Sparkles className="h-4 w-4" />
                Aula del Alumno
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Píldora flotante discreta abajo a la izquierda cuando estás viendo el Portal del Alumno en Modo Real */}
      {isStudentRoute && hideSimulatorBar && (
        <div className="fixed bottom-4 left-4 z-50 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setHideSimulatorBar(false)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            Cambiar Rol / Academia
          </button>
          <button
            type="button"
            onClick={simulateConcurrentLoginFromOtherDevice}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/25"
            title="Simular que alguien más abre la cuenta de este alumno en otro dispositivo"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            Probar Doble Sesión
          </button>
        </div>
      )}
    </>
  );
}
