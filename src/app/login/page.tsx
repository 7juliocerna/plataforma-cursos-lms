'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLMS } from '@/context/LMSContext';
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Database,
  FileSpreadsheet,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const {
    isSupabaseLive,
    signInWithEmail,
    signUpWithEmail,
    loginAsRole,
  } = useLMS();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('laura.gomez@agencia.co');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      if (authMode === 'login') {
        const res = await signInWithEmail(email, password);
        setFeedback(res);
        if (res.ok) {
          setTimeout(() => {
            if (res.role === 'admin') router.push('/superadmin');
            else router.push('/student');
          }, 600);
        }
      } else {
        const res = await signUpWithEmail(email, password, fullName);
        setFeedback(res);
        if (res.ok) {
          setTimeout(() => {
            router.push('/student');
          }, 800);
        }
      }
    } catch (err: any) {
      setFeedback({ ok: false, message: err?.message || 'Error durante la autenticación.' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccess = (emailToUse: string, roleToUse: 'admin' | 'student') => {
    setEmail(emailToUse);
    setPassword('password123');
    loginAsRole(roleToUse);
    setFeedback({
      ok: true,
      message: `Acceso rápido como ${roleToUse === 'admin' ? 'Administrador Dueño' : 'Alumno'}... Redirigiendo.`,
    });
    setTimeout(() => {
      if (roleToUse === 'admin') router.push('/superadmin');
      else router.push('/student');
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#F8FAFC] px-4 py-12 flex items-center justify-center text-[#1E293B]">
      <div className="mx-auto w-full max-w-5xl grid items-start gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: Formulario de Autenticación */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            {/* Cabecera limpia y neutral */}
            <div className="border-b border-[#E2E8F0] bg-[#FAF9F6] px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Campus Virtual • Plataforma Multi-Academia
                  </span>
                  <h1 className="text-xl font-bold text-[#1E293B]">
                    {authMode === 'login' ? 'Iniciar Sesión' : 'Crear tu Cuenta'}
                  </h1>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
                Acceso a tus Academias temáticas con lecciones en alta definición y certificación oficial.
              </p>
            </div>

            {/* Pestañas de modo: Iniciar Sesión vs Registro */}
            <div className="flex border-b border-[#E2E8F0] bg-[#F8FAFC] p-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setFeedback(null);
                }}
                className={`flex-1 rounded-lg py-2 transition ${
                  authMode === 'login'
                    ? 'bg-white text-[#1E293B] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Ya tengo cuenta (Ingresar)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setFeedback(null);
                }}
                className={`flex-1 rounded-lg py-2 transition ${
                  authMode === 'register'
                    ? 'bg-white text-[#1E293B] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Soy nuevo (Registrarme)
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 p-8">
              {feedback && (
                <div
                  className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-semibold ${
                    feedback.ok
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {feedback.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {authMode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#1E293B]">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#94A3B8]" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#1E293B] placeholder-[#94A3B8] focus:border-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1E293B]">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#94A3B8]" />
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#1E293B] placeholder-[#94A3B8] focus:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#1E293B]">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#94A3B8]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-[#1E293B] placeholder-[#94A3B8] focus:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? (
                  <span>Procesando...</span>
                ) : authMode === 'login' ? (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Iniciar Sesión en el Campus
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Crear mi Cuenta y Empezar
                  </>
                )}
              </button>

              {/* Indicador de estado Supabase */}
              <div className="pt-2 text-center">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#64748B]">
                  <Database className="h-3 w-3 text-emerald-600" />
                  {isSupabaseLive
                    ? 'Autenticación Conectada en Vivo con Supabase Auth (PostgreSQL)'
                    : 'Modo Local / Demo Activo (Transición sin fallos)'}
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Acceso Rápido Demo (1-Clic) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Acceso Rápido para Pruebas (1 Clic)
            </span>
            <h2 className="mt-1 text-base font-bold text-[#1E293B]">
              Prueba los 2 Roles de la Plataforma
            </h2>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              Selecciona cualquiera de las cuentas de prueba para ingresar instantáneamente:
            </p>

            <div className="mt-4 space-y-3">
              {/* Opción 1: Admin Único */}
              <button
                type="button"
                onClick={() => handleQuickAccess('ceo@plataformalms.com', 'admin')}
                className="w-full text-left rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 transition hover:bg-amber-50 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Crown className="h-4 w-4 text-amber-700" />
                    1. Administrador (Dueño Único)
                  </span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    Panel Admin
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#475569]">
                  Julio Cerna • <code className="text-[#64748B]">ceo@plataformalms.com</code>
                </div>
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Gestión total del catálogo, subida de videos Bunny.net y configuración de cobros.
                </p>
              </button>

              {/* Opción 2: Alumna con All-Access */}
              <button
                type="button"
                onClick={() => handleQuickAccess('laura.gomez@agencia.co', 'student')}
                className="w-full text-left rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 transition hover:bg-indigo-50/80 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                    <Sparkles className="h-4 w-4 text-indigo-700" />
                    2. Alumna con Pase Total (All-Access)
                  </span>
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-900">
                    Todas las Academias
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#475569]">
                  Laura Gómez • <code className="text-[#64748B]">laura.gomez@agencia.co</code>
                </div>
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Membresía activa con acceso a Excel, Marketing y Finanzas sin restricciones.
                </p>
              </button>

              {/* Opción 3: Alumno con suscripción individual (Excel) */}
              <button
                type="button"
                onClick={() => handleQuickAccess('andres@closerpro.co', 'student')}
                className="w-full text-left rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 transition hover:bg-slate-100 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-[#1E293B]">
                    <FileSpreadsheet className="h-4 w-4 text-[#1D4ED8]" />
                    3. Alumno Individual (Solo Excel)
                  </span>
                  <span className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 text-[10px] font-bold text-[#475569]">
                    1 Academia
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#475569]">
                  Andrés Villalba • <code className="text-[#64748B]">andres@closerpro.co</code>
                </div>
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Acceso exclusivo a la Academia de Excel (4 días restantes).
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
