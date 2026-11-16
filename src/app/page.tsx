'use client';

import React from 'react';
import Link from 'next/link';
import { useLMS } from '@/context/LMSContext';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Layers,
  Lock,
  PlayCircle,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';

export default function WhiteLabelLandingPage() {
  const { tenants, currentTenant, tenantCourses, selectTenantById } = useLMS();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Dinámico Marca Blanca */}
      <section className="relative overflow-hidden border-b border-slate-800/80 py-16 md:py-24">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[50rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: currentTenant.primary_color }}
        />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3.5 py-1.5 text-xs font-medium text-slate-300 shadow-sm">
                <Globe className="h-3.5 w-3.5" style={{ color: currentTenant.primary_color }} />
                <span>
                  Academia Oficial:{' '}
                  <strong className="text-white">
                    {currentTenant.custom_domain || `${currentTenant.slug}.plataformalms.com`}
                  </strong>
                </span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Bienvenido al Campus de{' '}
                <span style={{ color: currentTenant.primary_color }}>
                  {currentTenant.name}
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
                {currentTenant.tagline}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/student"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95"
                  style={{ backgroundColor: currentTenant.primary_color }}
                >
                  <PlayCircle className="h-5 w-5" />
                  Entrar al Aula Virtual
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  Iniciar Sesión ({currentTenant.name})
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Píldoras de Confianza */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-800/80 pt-8">
                <div>
                  <div className="text-2xl font-bold text-white">{tenantCourses.length}</div>
                  <div className="text-xs text-slate-400">Programas Habilitados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {currentTenant.used_licenses} / {currentTenant.max_licenses}
                  </div>
                  <div className="text-xs text-slate-400">Licencias Activas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">100%</div>
                  <div className="text-xs text-slate-400">Protección Sesión Única</div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Demostración Interactiva Marca Blanca */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Sparkles
                      className="h-5 w-5"
                      style={{ color: currentTenant.primary_color }}
                    />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      Prueba el Motor Marca Blanca en Vivo
                    </h2>
                  </div>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                    Multitenant
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Haz clic en cualquiera de las academias (tenants) registradas para ver cómo la
                  interfaz, el dominio, los colores y el catálogo de cursos cambian al instante:
                </p>

                <div className="mt-4 space-y-2.5">
                  {tenants.map((tenant) => {
                    const isSelected = tenant.id === currentTenant.id;
                    return (
                      <button
                        key={tenant.id}
                        type="button"
                        onClick={() => selectTenantById(tenant.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
                          isSelected
                            ? 'border-white/40 bg-slate-800/90 shadow-md'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white shadow"
                            style={{ backgroundColor: tenant.primary_color }}
                          >
                            {tenant.name.charAt(0)}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-white">{tenant.name}</div>
                            <div className="text-xs text-slate-400">
                              {tenant.custom_domain || `${tenant.slug}.lms.com`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                            style={{ backgroundColor: tenant.primary_color }}
                          >
                            {tenant.used_licenses}/{tenant.max_licenses} lic.
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-800 pt-4 text-center text-xs">
                  <Link
                    href="/superadmin"
                    className="rounded-lg bg-amber-500/15 px-2.5 py-2 font-semibold text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/25"
                  >
                    Ir a SuperAdmin
                  </Link>
                  <Link
                    href="/reseller"
                    className="rounded-lg bg-emerald-500/15 px-2.5 py-2 font-semibold text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"
                  >
                    Ir a Reseller
                  </Link>
                  <Link
                    href="/student"
                    className="rounded-lg bg-sky-500/15 px-2.5 py-2 font-semibold text-sky-300 ring-1 ring-sky-500/30 hover:bg-sky-500/25"
                  >
                    Ir a Alumno
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Cursos Exclusivo de la Academia Seleccionada */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: currentTenant.primary_color }}
            >
              Catálogo Filtrado por Tenant (RLS)
            </span>
            <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Programas Disponibles en {currentTenant.name}
            </h2>
          </div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            style={{ color: currentTenant.primary_color }}
          >
            Ver en el reproductor de clases
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenantCourses.map((course) => {
            const totalLessons = course.modules.reduce(
              (acc, m) => acc + m.lessons.length,
              0
            );
            return (
              <div
                key={course.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: currentTenant.primary_color }}
                    >
                      {course.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {course.duration_label}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-white">{course.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{course.subtitle}</p>
                </div>

                <div className="mt-6 border-t border-slate-800/80 pt-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-slate-500" />
                      {course.modules.length} módulos • {totalLessons} clases
                    </span>
                    <span className="font-medium text-slate-300">{course.level}</span>
                  </div>

                  <Link
                    href="/student"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                    style={{ backgroundColor: currentTenant.primary_color }}
                  >
                    <PlayCircle className="h-4 w-4" />
                    Reproducir Curso
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Arquitectura SaaS B2B Explicada para el Dueño del Negocio */}
      <section className="border-t border-slate-800/80 bg-slate-900/40 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Arquitectura Lista para Escalar tu Negocio de Cursos y Resellers
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
              Diseñada para mantener costos de servidor cercanos a $0 USD delegando el streaming pesado y asegurando tus licencias por base de datos.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <Layers className="h-7 w-7 text-indigo-400" />
              <h3 className="mt-3 font-bold text-white">1. Multitenant Real</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Cada Reseller tiene su propio subdominio o dominio personalizado, logotipo, paleta de colores y catálogo asignado.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <Users className="h-7 w-7 text-emerald-400" />
              <h3 className="mt-3 font-bold text-white">2. Candado de Licencias</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Un Reseller con un plan de 25 licencias solo puede tener 25 alumnos activos simultáneamente (validado en UI y por Trigger SQL).
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <Lock className="h-7 w-7 text-amber-400" />
              <h3 className="mt-3 font-bold text-white">3. Anti-Compartir Cuenta</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Token de sesión única por alumno. Si un estudiante comparte su clave con un amigo, la primera sesión se bloquea al instante.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <Shield className="h-7 w-7 text-sky-400" />
              <h3 className="mt-3 font-bold text-white">4. Streaming + Pagos</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Videos vía Bunny.net / Cloudflare Stream y webhooks listos para conectar Stripe y Mercado Pago.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
