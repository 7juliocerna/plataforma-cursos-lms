'use client';

import React, { useEffect, useState } from 'react';
import { useLMS } from '@/context/LMSContext';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  Globe,
  Lock,
  Palette,
  Smartphone,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react';

export default function ResellerDashboardPage() {
  const {
    currentTenant,
    users,
    tenantCourses,
    createStudent,
    toggleStudentActiveStatus,
    updateTenantBranding,
    updateTenantLicenseLimit,
  } = useLMS();

  const [activeTab, setActiveTab] = useState<'students' | 'branding' | 'courses'>('students');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Estado para Alta de Nuevo Alumno
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  // Estado para Personalizador Marca Blanca (Brand Studio)
  const [brandName, setBrandName] = useState(currentTenant.name);
  const [brandSlug, setBrandSlug] = useState(currentTenant.slug);
  const [brandDomain, setBrandDomain] = useState(currentTenant.custom_domain || '');
  const [brandLogo, setBrandLogo] = useState(currentTenant.logo_url || '');
  const [brandColor, setBrandColor] = useState(currentTenant.primary_color);
  const [brandTagline, setBrandTagline] = useState(currentTenant.tagline);
  const [brandEmail, setBrandEmail] = useState(currentTenant.support_email);

  useEffect(() => {
    setBrandName(currentTenant.name);
    setBrandSlug(currentTenant.slug);
    setBrandDomain(currentTenant.custom_domain || '');
    setBrandLogo(currentTenant.logo_url || '');
    setBrandColor(currentTenant.primary_color);
    setBrandTagline(currentTenant.tagline);
    setBrandEmail(currentTenant.support_email);
  }, [currentTenant]);

  const tenantStudents = users.filter(
    (u) => u.tenant_id === currentTenant.id && u.role === 'student'
  );
  const activeStudentsCount = tenantStudents.filter((s) => s.is_active).length;
  const isLicenseLimitReached = activeStudentsCount >= currentTenant.max_licenses;
  const licensePercent = Math.min(
    100,
    Math.round((activeStudentsCount / Math.max(1, currentTenant.max_licenses)) * 100)
  );

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createStudent({
      full_name: studentName,
      email: studentEmail,
      tenant_id: currentTenant.id,
    });
    setFeedback(res);
    if (res.ok) {
      setStudentName('');
      setStudentEmail('');
    }
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateTenantBranding(currentTenant.id, {
      name: brandName,
      slug: brandSlug,
      custom_domain: brandDomain || null,
      logo_url: brandLogo || null,
      primary_color: brandColor,
      secondary_color: currentTenant.secondary_color,
      accent_color: currentTenant.accent_color,
      tagline: brandTagline,
      support_email: brandEmail,
    });
    setFeedback(res);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Cabecera Dinámica del Reseller */}
      <div
        className="rounded-3xl border border-slate-800 p-6 md:p-8"
        style={{
          background: `linear-gradient(135deg, ${currentTenant.primary_color}22, #0f172a 70%)`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: currentTenant.primary_color }}
            >
              <Building2 className="h-3.5 w-3.5" />
              ROL 2: PANEL RESELLER / ADMIN DE ACADEMIA
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
              Administración de {currentTenant.name}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Dominio activo:{' '}
              <strong className="text-white">
                {currentTenant.custom_domain || `${currentTenant.slug}.plataformalms.com`}
              </strong>{' '}
              • Gestiona tus alumnos, licencias y personalización Marca Blanca.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === 'students'
                  ? 'text-white shadow-lg'
                  : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              style={
                activeTab === 'students'
                  ? { backgroundColor: currentTenant.primary_color }
                  : undefined
              }
            >
              <Users className="h-4 w-4" />
              Alumnos & Licencias ({activeStudentsCount}/{currentTenant.max_licenses})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('branding')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === 'branding'
                  ? 'text-white shadow-lg'
                  : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              style={
                activeTab === 'branding'
                  ? { backgroundColor: currentTenant.primary_color }
                  : undefined
              }
            >
              <Palette className="h-4 w-4" />
              Personalizar Marca Blanca
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === 'courses'
                  ? 'text-white shadow-lg'
                  : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              style={
                activeTab === 'courses'
                  ? { backgroundColor: currentTenant.primary_color }
                  : undefined
              }
            >
              <BookOpen className="h-4 w-4" />
              Cursos Asignados ({tenantCourses.length})
            </button>
          </div>
        </div>

        {/* Medidor de Licencias en Tiempo Real */}
        <div className="mt-6 rounded-2xl border border-slate-800/90 bg-slate-950/85 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Estado de tu Plan de Licencias ({currentTenant.plan_name})
              </span>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-2xl font-extrabold text-white">
                  {activeStudentsCount} / {currentTenant.max_licenses} Alumnos Activos
                </span>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                    isLicenseLimitReached
                      ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {isLicenseLimitReached
                    ? '100% Cupo Lleno (Bloqueado)'
                    : `${currentTenant.max_licenses - activeStudentsCount} licencias disponibles`}
                </span>
              </div>
            </div>

            {isLicenseLimitReached && (
              <button
                type="button"
                onClick={() => {
                  updateTenantLicenseLimit(
                    currentTenant.id,
                    currentTenant.max_licenses + 5,
                    `Pack Reseller ${currentTenant.max_licenses + 5} Alumnos`
                  );
                  setFeedback({
                    ok: true,
                    message: `¡Ampliación exitosa! Tu academia ahora cuenta con ${
                      currentTenant.max_licenses + 5
                    } licencias disponibles.`,
                  });
                }}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow hover:bg-amber-400"
              >
                + Comprar 5 Licencias Extra (Demo Upgrade)
              </button>
            )}
          </div>

          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${licensePercent}%`,
                backgroundColor: isLicenseLimitReached
                  ? '#F43F5E'
                  : currentTenant.primary_color,
              }}
            />
          </div>
        </div>
      </div>

      {/* Mensaje de Feedback */}
      {feedback && (
        <div
          className={`mt-6 flex items-center justify-between rounded-2xl border px-5 py-3.5 text-sm ${
            feedback.ok
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.ok ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* TAB 1: GESTIÓN DE ALUMNOS Y CONTROL DE LICENCIAS */}
      {activeTab === 'students' && (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Tabla de Alumnos */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Listado de Alumnos de {currentTenant.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Dar de baja a un alumno libera inmediatamente su licencia para asignarla a otra persona.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {tenantStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                      student.is_active
                        ? 'border-slate-800 bg-slate-950/80'
                        : 'border-slate-800/50 bg-slate-950/30 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white"
                        style={{
                          backgroundColor: student.is_active
                            ? currentTenant.primary_color
                            : '#334155',
                        }}
                      >
                        {student.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{student.full_name}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              student.is_active
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {student.is_active ? 'Licencia Activa' : 'Dado de Baja'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{student.email}</div>
                        {student.is_active && student.active_session_device && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Smartphone className="h-3 w-3 text-emerald-400" />
                            Sesión única activa en: {student.active_session_device}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const res = toggleStudentActiveStatus(student.id);
                        setFeedback(res);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        student.is_active
                          ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                          : isLicenseLimitReached
                          ? 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-500'
                          : 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      }`}
                    >
                      {student.is_active ? (
                        <>
                          <UserX className="h-3.5 w-3.5" />
                          Dar de Baja (Liberar Licencia)
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          Reactivar Licencia
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formulario Alta de Nuevo Alumno con Candado de Licencias */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
              <div className="flex items-center gap-2.5">
                <UserPlus
                  className="h-5 w-5"
                  style={{ color: currentTenant.primary_color }}
                />
                <h2 className="text-lg font-bold text-white">Dar de Alta Nuevo Alumno</h2>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Cada alumno activo ocupa 1 licencia de tu plan contratado ({activeStudentsCount}/
                {currentTenant.max_licenses}).
              </p>

              {isLicenseLimitReached && (
                <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200">
                  <div className="flex items-center gap-2 font-bold text-rose-300">
                    <Lock className="h-4 w-4" />
                    Límite de Licencias Alcanzado ({activeStudentsCount}/{currentTenant.max_licenses})
                  </div>
                  <p className="mt-1 leading-relaxed text-rose-200/90">
                    No puedes activar más alumnos hasta que des de baja a un estudiante actual o
                    amplíes tu paquete de licencias.
                  </p>
                </div>
              )}

              <form onSubmit={handleAddStudent} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Nombre Completo del Alumno *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Ej: Mateo Restrepo"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Correo Electrónico de Acceso *
                  </label>
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="mateo@empresa.com"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl py-3 text-sm font-extrabold text-white shadow-lg transition hover:opacity-95"
                  style={{
                    backgroundColor: isLicenseLimitReached
                      ? '#475569'
                      : currentTenant.primary_color,
                  }}
                >
                  {isLicenseLimitReached
                    ? 'Cupo Lleno — Probar Bloqueo de Seguridad'
                    : 'Activar Alumno y Asignar 1 Licencia'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ESTUDIO DE MARCA BLANCA (BRAND STUDIO) */}
      {activeTab === 'branding' && (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSaveBranding}
              className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 md:p-8"
            >
              <h2 className="text-xl font-bold text-white">
                Configuración de Marca Blanca (White-Label Studio)
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Personaliza el nombre, colores, logotipo y dominio de tu academia. Los cambios se aplican al instante en el Login, Landing y Aula de tus alumnos.
              </p>

              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Nombre de la Academia
                    </label>
                    <input
                      type="text"
                      required
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Subdominio (`slug`)
                    </label>
                    <input
                      type="text"
                      required
                      value={brandSlug}
                      onChange={(e) => setBrandSlug(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Dominio Personalizado (CNAME)
                    </label>
                    <input
                      type="text"
                      value={brandDomain}
                      onChange={(e) => setBrandDomain(e.target.value)}
                      placeholder="campus.miacademia.com"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      URL de Logotipo (Opcional)
                    </label>
                    <input
                      type="text"
                      value={brandLogo}
                      onChange={(e) => setBrandLogo(e.target.value)}
                      placeholder="https://.../logo.png"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Color Primario de Marca
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-1"
                    />
                    {[
                      '#E11D48',
                      '#4F46E5',
                      '#059669',
                      '#D97706',
                      '#0284C7',
                      '#9333EA',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBrandColor(preset)}
                        className="h-8 w-8 rounded-full border-2 border-white/20 transition hover:scale-110"
                        style={{ backgroundColor: preset }}
                        title={`Usar color ${preset}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Eslogan / Mensaje de Bienvenida
                  </label>
                  <input
                    type="text"
                    value={brandTagline}
                    onChange={(e) => setBrandTagline(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Correo de Soporte para tus Alumnos
                  </label>
                  <input
                    type="email"
                    value={brandEmail}
                    onChange={(e) => setBrandEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:opacity-95"
                  style={{ backgroundColor: brandColor }}
                >
                  Guardar y Aplicar Marca Blanca en Vivo
                </button>
              </div>
            </form>
          </div>

          {/* Vista Previa en Vivo */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Vista Previa Instantánea del Portal del Alumno
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                <div
                  className="p-6 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${brandColor}, #0f172a)`,
                  }}
                >
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <Globe className="h-3.5 w-3.5" />
                    {brandDomain || `${brandSlug}.plataformalms.com`}
                  </div>
                  <div className="mt-2 text-xl font-extrabold">{brandName}</div>
                  <p className="mt-1 text-xs text-white/80">{brandTagline}</p>
                </div>
                <div className="p-5">
                  <div className="text-xs text-slate-400">
                    Botones, barras de progreso y certificados de tus alumnos se teñirán con el color{' '}
                    <code className="text-white">{brandColor}</code>.
                  </div>
                  <div
                    className="mt-4 rounded-xl py-2.5 text-center text-xs font-bold text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    Botón de Ejemplo en tu Aula Virtual
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CURSOS ASIGNADOS A ESTA ACADEMIA */}
      {activeTab === 'courses' && (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenantCourses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
            >
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: currentTenant.primary_color }}
              >
                {course.category}
              </span>
              <h3 className="mt-3 text-lg font-bold text-white">{course.title}</h3>
              <p className="mt-1 text-xs text-slate-400">{course.subtitle}</p>
              <div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-300">
                {course.modules.length} módulos incluidos en tu licencia de distribución.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
