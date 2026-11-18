'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLMS } from '@/context/LMSContext';
import {
  Crown,
  Database,
  GraduationCap,
  LogIn,
  LogOut,
  Palette,
  RotateCcw,
} from 'lucide-react';

export function WhiteLabelTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isSupabaseLive,
    academies,
    currentAcademy,
    currentUser,
    selectAcademyById,
    loginAsRole,
    logout,
    resetDemoData,
    isClassroomFocusMode,
  } = useLMS();

  // En Modo Enfoque (reproductor de clases activo), ocultamos la barra global
  // para cumplir con la ergonomía cognitiva y reduccionismo funcional.
  if (isClassroomFocusMode) {
    return null;
  }

  const handleRoleSwitch = (role: 'admin' | 'student') => {
    loginAsRole(role);
    if (role === 'admin') router.push('/superadmin');
    if (role === 'student') router.push('/student');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
      {/* Barra de control superior para el Administrador / Selector Multi-Marca */}
      <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-1.5 text-xs text-[#64748B]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Selector de Subdominio / Academia Temática */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#475569]">
              <Palette className="h-3.5 w-3.5 text-[#64748B]" />
              Subdominio Temático:
            </span>
            <select
              aria-label="Seleccionar Subdominio"
              value={currentAcademy.id}
              onChange={(e) => selectAcademyById(e.target.value)}
              className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-medium text-[#1E293B] shadow-sm transition hover:border-slate-400 focus:outline-none"
            >
              {academies.map((academy) => (
                <option key={academy.id} value={academy.id}>
                  {academy.slug}.tuacademia.com ({academy.title})
                </option>
              ))}
            </select>
          </div>

          {/* Conmutador Rápido de Roles: Administrador vs Estudiante */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#64748B] font-medium hidden sm:inline">Vista:</span>
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                pathname.startsWith('/superadmin')
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              Admin Central
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('student')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                pathname.startsWith('/student')
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : 'bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Estudiante
            </button>
          </div>

          {/* Estado de Supabase & Reset */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                isSupabaseLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Database className="h-3 w-3" />
              {isSupabaseLive ? 'Supabase Live' : 'Demo Local'}
            </span>

            <button
              type="button"
              onClick={() => {
                resetDemoData();
                window.location.reload();
              }}
              title="Restaurar datos iniciales"
              className="rounded-md border border-[#E2E8F0] bg-white p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Barra Principal de Navegación (Multi-Brand Neutral) */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logotipo Global Consistente con Identidad del Subdominio */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white font-extrabold text-sm shadow-sm transition group-hover:opacity-90"
            style={{ backgroundColor: currentAcademy.primary_color }}
          >
            {currentAcademy.title.charAt(0)}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-[#1E293B] text-base tracking-tight">
              TUACADEMIA
            </span>
            <span className="text-[#CBD5E1] font-light">|</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
              {currentAcademy.slug}
            </span>
          </div>
        </Link>

        {/* Enlaces de Navegación */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:inline-flex rounded-lg px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] transition"
          >
            Catálogo
          </Link>

          <Link
            href="/student"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] transition"
          >
            Mi Aula Virtual
          </Link>

          {currentUser?.role === 'admin' && (
            <Link
              href="/superadmin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#1E293B] hover:bg-[#F1F5F9] transition"
            >
              <Crown className="h-3.5 w-3.5 text-amber-600" />
              SuperAdmin
            </Link>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E2E8F0]">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-[#1E293B] line-clamp-1">
                  {currentUser.full_name}
                </div>
                <span className="text-[10px] text-[#64748B] font-mono">
                  {currentUser.role === 'admin' ? 'Admin' : currentUser.is_all_access ? 'Pase Total' : 'Alumno'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                title="Cerrar Sesión"
                className="rounded-lg border border-[#E2E8F0] bg-white p-2 text-[#64748B] hover:bg-[#F1F5F9] hover:text-rose-600 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: currentAcademy.primary_color }}
            >
              <LogIn className="h-3.5 w-3.5" />
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
