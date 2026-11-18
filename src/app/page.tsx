'use client';

import React from 'react';
import Link from 'next/link';
import { useLMS } from '@/context/LMSContext';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  GraduationCap,
  PlayCircle,
  Sparkles,
} from 'lucide-react';

export default function MultiAcademiaLandingPage() {
  const {
    academies,
    currentAcademy,
    selectAcademyById,
    academyCourses,
    globalPaymentSettings,
  } = useLMS();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Hero Dinámico Multi-Academia (Ergonomía Visual & Neutral Off-White) */}
      <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-white py-14 md:py-20">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              {/* Badge sutil de contexto */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-1.5 text-xs font-semibold text-[#475569]">
                <GraduationCap
                  className="h-3.5 w-3.5"
                  style={{ color: currentAcademy.primary_color }}
                />
                <span>
                  Plataforma Central •{' '}
                  <strong className="text-[#1E293B]">{currentAcademy.title}</strong>
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#1E293B] sm:text-5xl lg:text-6xl">
                Aprende Habilidades Profesionales en{' '}
                <span style={{ color: currentAcademy.primary_color }}>
                  {currentAcademy.title}
                </span>
              </h1>

              <p className="measure-reading mt-4 text-base text-[#475569] leading-relaxed sm:text-lg">
                {currentAcademy.description}. Accede a lecciones con casos prácticos reales, material descargable y certificación oficial.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/student"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
                  style={{ backgroundColor: currentAcademy.primary_color }}
                >
                  <PlayCircle className="h-4 w-4" />
                  Entrar al Aula Virtual
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-3 text-sm font-semibold text-[#1E293B] transition hover:bg-[#F8FAFC] shadow-2xs"
                >
                  Iniciar Sesión / Registro
                  <ArrowRight className="h-4 w-4 text-[#64748B]" />
                </Link>
              </div>

              {/* Píldoras de Planes y Garantía */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[#E2E8F0] pt-6">
                <div>
                  <div className="text-2xl font-bold text-[#1E293B]">
                    ${currentAcademy.price_monthly}
                    <span className="text-xs text-[#64748B] font-normal">/mes</span>
                  </div>
                  <div className="text-xs text-[#64748B]">Esta Academia</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-700">
                    ${globalPaymentSettings.all_access_price_monthly}
                    <span className="text-xs text-[#64748B] font-normal">/mes</span>
                  </div>
                  <div className="text-xs text-[#64748B]">Pase Total All-Access</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-700">100%</div>
                  <div className="text-xs text-[#64748B]">Protección Anti-Piratería</div>
                </div>
              </div>
            </div>

            {/* Selector Bento de Academias Temáticas */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#FAF9F6] p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="h-4 w-4"
                      style={{ color: currentAcademy.primary_color }}
                    />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Academias Temáticas
                    </h2>
                  </div>
                  <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    Especializadas
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#64748B]">
                  Elige una academia temática para explorar sus cursos y programas:
                </p>

                <div className="mt-4 space-y-2.5">
                  {academies.map((acad) => {
                    const isSelected = acad.id === currentAcademy.id;
                    return (
                      <button
                        key={acad.id}
                        type="button"
                        onClick={() => selectAcademyById(acad.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-slate-800 bg-white ring-1 ring-slate-800 shadow-sm'
                            : 'border-[#E2E8F0] bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white shadow-xs text-xs"
                            style={{ backgroundColor: acad.primary_color }}
                          >
                            {acad.title.charAt(0)}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#1E293B]">{acad.title}</div>
                            <div className="text-[11px] text-[#64748B] line-clamp-1">
                              {acad.description}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: acad.primary_color }}
                          >
                            ${acad.price_monthly}/mes
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#E2E8F0] pt-4 text-center text-xs font-semibold">
                  <Link
                    href="/superadmin"
                    className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-2 text-[#1E293B] hover:bg-slate-50 transition shadow-2xs"
                  >
                    Panel Admin
                  </Link>
                  <Link
                    href="/student"
                    className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-2 text-[#1E293B] hover:bg-slate-50 transition shadow-2xs"
                  >
                    Portal Alumno
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Cursos de la Academia Seleccionada */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: currentAcademy.primary_color }}
            >
              Cursos Especializados
            </span>
            <h2 className="mt-1 text-2xl font-bold text-[#1E293B] sm:text-3xl">
              Catálogo de {currentAcademy.title}
            </h2>
          </div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
            style={{ color: currentAcademy.primary_color }}
          >
            Ver en el aula virtual
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {academyCourses.map((course) => {
            const totalLessons = course.modules.reduce(
              (acc, m) => acc + m.lessons.length,
              0
            );
            return (
              <div
                key={course.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-md px-2.5 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: currentAcademy.primary_color }}
                    >
                      {course.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#64748B]">
                      <Clock className="h-3.5 w-3.5" />
                      {course.duration_label}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-[#1E293B]">{course.title}</h3>
                  <p className="mt-1 text-xs text-[#64748B] leading-relaxed">{course.subtitle}</p>
                </div>

                <div className="mt-6 border-t border-[#E2E8F0] pt-4">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-[#94A3B8]" />
                      {course.modules.length} temas • {totalLessons} clases
                    </span>
                    <span className="font-medium text-[#475569]">{course.level}</span>
                  </div>

                  <Link
                    href="/student"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-white transition hover:opacity-95 shadow-xs"
                    style={{ backgroundColor: currentAcademy.primary_color }}
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

      {/* Planes y Membresías: Individual vs All-Access */}
      <section className="border-t border-[#E2E8F0] bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1E293B] sm:text-3xl">
              Elige tu Plan de Aprendizaje
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-[#64748B]">
              Accede a una academia temática individual o adquiere el Pase Total All-Access para desbloquear todo el catálogo.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Opción 1: Academia Individual */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="inline-block rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-semibold text-[#475569]">
                  Acceso Temático
                </span>
                <h3 className="mt-4 text-xl font-bold text-[#1E293B]">
                  {currentAcademy.title}
                </h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Acceso completo a todos los cursos y recursos de esta academia.
                </p>
                <div className="mt-5">
                  <span className="text-3xl font-extrabold text-[#1E293B]">
                    ${currentAcademy.price_monthly}
                  </span>
                  <span className="text-[#64748B] text-xs"> / mes</span>
                  <div className="text-xs text-[#64748B] mt-1">
                    o ${currentAcademy.price_annual} / año (ahorra 35%)
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-[#475569]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Acceso a {academyCourses.length} cursos de {currentAcademy.title}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Certificado oficial al completar cada curso
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Reproducción HD con marca de agua de seguridad
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                className="mt-7 flex w-full items-center justify-center rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-xs font-bold text-[#1E293B] hover:bg-slate-50 transition shadow-2xs"
              >
                Suscribirme a esta Academia
              </Link>
            </div>

            {/* Opción 2: All-Access Pass */}
            <div className="relative rounded-2xl border-2 border-slate-800 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              <div className="absolute -top-3 right-6 rounded-full bg-slate-900 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Recomendado
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
                  <Crown className="h-3.5 w-3.5" />
                  Membresía All-Access
                </span>
                <h3 className="mt-4 text-xl font-bold text-[#1E293B]">
                  Pase Total a Todas las Academias
                </h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Desbloquea todas las academias temáticas presentes y futuras con un solo acceso.
                </p>
                <div className="mt-5">
                  <span className="text-3xl font-extrabold text-[#1E293B]">
                    ${globalPaymentSettings.all_access_price_monthly}
                  </span>
                  <span className="text-[#64748B] text-xs"> / mes</span>
                  <div className="text-xs text-indigo-700 font-semibold mt-1">
                    o ${globalPaymentSettings.all_access_price_annual} / año (ahorro máximo)
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-[#475569]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    Acceso a las {academies.length} Academias Temáticas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    Todos los cursos actuales y futuros lanzamientos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    Certificados oficiales en cada especialidad
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    Soporte prioritario directo
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                className="mt-7 flex w-full items-center justify-center rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-sm"
              >
                Obtener Pase Total All-Access
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
