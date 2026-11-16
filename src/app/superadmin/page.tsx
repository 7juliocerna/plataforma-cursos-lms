'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BunnyRemoteVideo, useLMS } from '@/context/LMSContext';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  ExternalLink,
  FolderKanban,
  FolderPlus,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  Video,
  Webhook,
  X,
} from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const {
    tenants,
    courses,
    webhookLogs,
    selectTenantById,
    createTenant,
    updateTenantLicenseLimit,
    toggleCourseForTenant,
    createCourse,
    renameCourse,
    addModuleToCourse,
    renameModuleInCourse,
    toggleModuleSubtemaZero,
    sortModuleLessonsAlphabetically,
    reorderModuleInCourse,
    deleteModuleFromCourse,
    renameLessonInCourse,
    moveLessonToModule,
    reorderLessonInModule,
    deleteLessonFromCourse,
    assignBunnyVideosToSubtema,
    syncBunnyVideosIntoCourse,
    triggerSimulatedWebhook,
  } = useLMS();

  const [activeTab, setActiveTab] = useState<'courses' | 'tenants' | 'webhooks'>('courses');
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Curso actualmente seleccionado en el Constructor de Subtemas
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || 'aaaa1111-1111-1111-1111-111111111111'
  );

  const activeCourse =
    courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Crear nuevo Subtema rápido (+ opción de Subtema 0 Introducción)
  const [newSubtemaTitle, setNewSubtemaTitle] = useState('');
  const [newSubtemaIsZero, setNewSubtemaIsZero] = useState(false);

  // Estados de edición en línea (Curso, Subtema, Clase)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourseTitle, setEditingCourseTitle] = useState<string>('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState<string>('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonTitle, setEditingLessonTitle] = useState<string>('');

  // Selector por lotes para meter varios videos de Bunny a un Subtema específico
  const [pickerModuleId, setPickerModuleId] = useState<string | null>(null);
  const [checkedBunnyGuids, setCheckedBunnyGuids] = useState<string[]>([]);

  // Videos traídos en vivo desde Bunny.net Stream (#808934)
  const [bunnyVideos, setBunnyVideos] = useState<BunnyRemoteVideo[]>([]);
  const [loadingBunny, setLoadingBunny] = useState(false);

  // Estado para Crear Curso Nuevo desde Cero
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSubtitle, setCourseSubtitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('Diseño & Edición Profesional');
  const [firstSubtemaName, setFirstSubtemaName] = useState('Tema 1: Introducción');

  // Estado formulario Crear Nueva Academia / Reseller
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantDomain, setNewTenantDomain] = useState('');
  const [newTenantColor, setNewTenantColor] = useState('#7C3AED');
  const [newTenantLicenses, setNewTenantLicenses] = useState(25);
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantTagline, setNewTenantTagline] = useState('');

  // Cargar automáticamente la lista de videos de Bunny al entrar al panel (ordenados alfabética y numéricamente)
  const fetchBunnyLibrary = async () => {
    setLoadingBunny(true);
    try {
      const res = await fetch('/api/bunny/videos');
      const data = await res.json();
      if (data.ok && Array.isArray(data.videos)) {
        const sortedVideos = [...data.videos].sort((a, b) =>
          String(a.title || '').localeCompare(String(b.title || ''), 'es', {
            numeric: true,
            sensitivity: 'base',
          })
        );
        setBunnyVideos(sortedVideos);
      }
    } catch {
      // Ignorar si no hay red
    } finally {
      setLoadingBunny(false);
    }
  };

  useEffect(() => {
    fetchBunnyLibrary();
  }, []);

  const handleCreateSubtema = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse || !newSubtemaTitle.trim()) return;
    const res = addModuleToCourse({
      course_id: activeCourse.id,
      title: newSubtemaTitle.trim(),
      is_subtema_zero: newSubtemaIsZero,
    });
    setBannerMsg(res.message);
    if (res.ok && res.moduleId) {
      setNewSubtemaTitle('');
      setNewSubtemaIsZero(false);
      setPickerModuleId(res.moduleId);
    }
  };

  const handleBatchAssignToSubtema = (moduleId: string) => {
    if (!activeCourse) return;
    const selectedObjs = bunnyVideos
      .filter((v) => checkedBunnyGuids.includes(v.guid))
      .sort((a, b) =>
        a.title.localeCompare(b.title, 'es', {
          numeric: true,
          sensitivity: 'base',
        })
      );
    const res = assignBunnyVideosToSubtema(
      activeCourse.id,
      moduleId,
      selectedObjs
    );
    setBannerMsg(res.message);
    if (res.ok) {
      setCheckedBunnyGuids([]);
      setPickerModuleId(null);
    }
  };

  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createCourse({
      title: courseTitle,
      subtitle: courseSubtitle,
      description: courseSubtitle,
      category: courseCategory,
      level: 'Práctico Paso a Paso',
      duration_label: 'Curso Completo',
      module_title: firstSubtemaName,
      assigned_tenant_ids: tenants.map((t) => t.id),
    });
    setBannerMsg(res.message);
    if (res.ok && res.courseId) {
      setSelectedCourseId(res.courseId);
      setCourseTitle('');
      setCourseSubtitle('');
      setShowNewCourseModal(false);
    }
  };

  const handleCreateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createTenant({
      name: newTenantName,
      slug: newTenantSlug,
      custom_domain: newTenantDomain,
      primary_color: newTenantColor,
      tagline: newTenantTagline,
      support_email: newTenantEmail,
      plan_name: `Pack Reseller ${newTenantLicenses} Alumnos`,
      max_licenses: newTenantLicenses,
      assigned_course_ids: courses.map((c) => c.id),
    });
    setBannerMsg(res.message);
    if (res.ok) {
      setNewTenantName('');
      setNewTenantSlug('');
      setNewTenantDomain('');
      setNewTenantEmail('');
      setNewTenantTagline('');
    }
  };

  const totalSoldLicenses = tenants.reduce((acc, t) => acc + t.max_licenses, 0);
  const totalActiveStudents = tenants.reduce((acc, t) => acc + t.used_licenses, 0);
  const estimatedMRR = tenants.length * 149 + totalSoldLicenses * 2;

  // Mapa global de todos los videos que YA están ubicados en algún curso/subtema
  const allAssignedVideoGuids = new Set<string>();
  const videoGuidToModuleMap = new Map<string, { moduleId: string; moduleTitle: string }>();

  for (const c of courses) {
    for (const mod of c.modules) {
      for (const les of mod.lessons) {
        allAssignedVideoGuids.add(les.video_id);
        if (activeCourse && c.id === activeCourse.id) {
          videoGuidToModuleMap.set(les.video_id, {
            moduleId: mod.id,
            moduleTitle: mod.title,
          });
        }
      }
    }
  }

  // Lista exclusiva de videos SUELTOS / NUEVOS que NO están ubicados en ningún curso ni subtema,
  // ordenados siempre en orden numérico y alfabético natural (0.1, 1.1, 1.2, 2.1, A-Z)
  const unassignedBunnyVideos = [...bunnyVideos]
    .filter((bv) => !allAssignedVideoGuids.has(bv.guid))
    .sort((a, b) =>
      String(a.title || '').localeCompare(String(b.title || ''), 'es', {
        numeric: true,
        sensitivity: 'base',
      })
    );

  // Calcula el número real de cada Subtema: si está marcado como Subtema 0 devuelve 0,
  // y los demás subtemas se numeran correlativamente desde 1 (Subtema 1, Subtema 2...)
  const getSubtemaNumber = (
    modules: typeof activeCourse.modules,
    index: number
  ): number => {
    const current = modules[index];
    if (current?.is_subtema_zero) return 0;
    let regularCountBefore = 0;
    for (let i = 0; i < index; i++) {
      if (!modules[i].is_subtema_zero) {
        regularCountBefore++;
      }
    }
    return regularCountBefore + 1;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Encabezado Ejecutivo SuperAdmin */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-6 md:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
            <Crown className="h-3.5 w-3.5" />
            PANEL SUPERADMIN • CONSTRUCTOR DE CURSOS Y TEMAS
          </div>
          <h1 className="mt-2.5 text-2xl font-extrabold text-white sm:text-3xl">
            Organizador Visual de Temas & Videos de Bunny Stream
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Como Bunny.net no tiene subcarpetas, aquí puedes crear todos los <strong>Temas</strong> que quieras y repartir tus videos de Bunny en cada Tema con 1 clic.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'courses'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="h-4 w-4" />
            Constructor de Temas ({courses.length} Cursos)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'tenants'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Academias & Licencias ({tenants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('webhooks')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'webhooks'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Webhook className="h-4 w-4" />
            Pagos Stripe / Mercado Pago
          </button>
        </div>
      </div>

      {/* Notificación de Acción */}
      {bannerMsg && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3.5 text-sm text-emerald-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{bannerMsg}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/student')}
              className="rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
            >
              Ver resultado en Pantalla Alumno →
            </button>
            <button
              type="button"
              onClick={() => setBannerMsg(null)}
              className="text-xs font-semibold text-emerald-300 hover:underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 1: CONSTRUCTOR VISUAL DE TEMAS Y ORGANIZADOR DE BUNNY STREAM
      ===================================================================== */}
      {activeTab === 'courses' && activeCourse && (
        <div className="mt-7 space-y-6">
          {/* Barra Superior: Selector del Curso que quieres organizar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Selecciona el Curso a editar:
              </span>
              {courses.map((course) => {
                const isSelected = course.id === activeCourse.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setPickerModuleId(null);
                    }}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {course.title} ({course.modules.length} Temas)
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowNewCourseModal(!showNewCourseModal)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25"
            >
              <Plus className="h-4 w-4" />
              Crear Nuevo Curso
            </button>
          </div>

          {/* Modal / Formulario para Crear un Nuevo Curso */}
          {showNewCourseModal && (
            <form
              onSubmit={handleCreateCourseSubmit}
              className="rounded-3xl border-2 border-amber-500/40 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-amber-300">
                  Crear un Nuevo Curso Maestro
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewCourseModal(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cerrar ✕
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Nombre del Curso *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Ej: Curso Completo de Photoshop Pro"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Descripción Corta *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseSubtitle}
                    onChange={(e) => setCourseSubtitle(e.target.value)}
                    placeholder="Domina edición, capas y automatización"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Nombre de su Primer Tema *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstSubtemaName}
                    onChange={(e) => setFirstSubtemaName(e.target.value)}
                    placeholder="Ej: 01. Introducción y Herramientas"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-400"
                >
                  Crear Curso y Empezar a Armar Temas
                </button>
              </div>
            </form>
          )}

          {/* ÁREA PRINCIPAL DE TRABAJO (2 COLUMNAS):
              Izquierda (7 cols): Constructor de Temas del Curso Activo
              Derecha (5 cols): Bandeja de Videos de Bunny Stream para repartirlos en Temas */}
          <div className="grid gap-8 lg:grid-cols-12">
            {/* COLUMNA IZQUIERDA (7 COLS): CONSTRUCTOR DE TEMAS DEL CURSO */}
            <div className="space-y-6 lg:col-span-7">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                {/* Cabecera del Curso Activo con edición de título */}
                <div className="border-b border-slate-800 pb-5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                    Estructura de Temas del Curso Activo
                  </span>

                  {editingCourseId === activeCourse.id ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editingCourseTitle}
                        onChange={(e) => setEditingCourseTitle(e.target.value)}
                        className="flex-1 rounded-xl border border-amber-500 bg-slate-950 px-3.5 py-2 text-lg font-bold text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const res = renameCourse(activeCourse.id, editingCourseTitle);
                          setBannerMsg(res.message);
                          setEditingCourseId(null);
                        }}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-slate-950"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCourseId(null)}
                        className="rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-2xl font-extrabold text-white">
                        {activeCourse.title}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCourseId(activeCourse.id);
                          setEditingCourseTitle(activeCourse.title);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-amber-500/50 hover:text-amber-300"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Cambiar nombre del curso
                      </button>
                    </div>
                  )}
                </div>

                {/* BARRA DESTACADA PARA CREAR UN NUEVO TEMA EN 1 CLIC (+ OPCIÓN TEMA 0) */}
                <form
                  onSubmit={handleCreateSubtema}
                  className="mt-5 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      <FolderPlus className="h-4 w-4" />
                      Crear un Nuevo Tema en este Curso:
                    </label>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20">
                      <input
                        type="checkbox"
                        checked={newSubtemaIsZero}
                        onChange={(e) => setNewSubtemaIsZero(e.target.checked)}
                        className="h-3.5 w-3.5 rounded accent-cyan-400"
                      />
                      Marcar como Tema 0 (Introducción)
                    </label>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    <input
                      type="text"
                      required
                      value={newSubtemaTitle}
                      onChange={(e) => setNewSubtemaTitle(e.target.value)}
                      placeholder={
                        newSubtemaIsZero
                          ? 'Ej: 00. Introducción y Bienvenida al Programa'
                          : 'Escribe el nombre del Tema (ej: 03. Modos de fusión en Retoque Fotográfico)'
                      }
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg transition hover:bg-amber-400"
                    >
                      <Plus className="h-4 w-4" />
                      {newSubtemaIsZero ? 'Crear Tema 0' : 'Crear Tema'}
                    </button>
                  </div>
                </form>

                {/* LISTA DE TEMAS DEL CURSO */}
                <div className="mt-6 space-y-5">
                  {activeCourse.modules.map((mod, modIndex) => {
                    const isPickerOpen = pickerModuleId === mod.id;
                    const subtemaNum = getSubtemaNumber(activeCourse.modules, modIndex);
                    const isZero = Boolean(mod.is_subtema_zero);

                    return (
                      <div
                        key={mod.id}
                        className={`rounded-2xl border p-5 shadow-md ${
                          isZero
                            ? 'border-cyan-500/40 bg-slate-950/95'
                            : 'border-slate-800 bg-slate-950/90'
                        }`}
                      >
                        {/* Cabecera del Tema: Nombre editable + Opción Tema 0 + Subir/Bajar + Meter videos + Borrar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                  isZero
                                    ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {isZero ? 'Tema 0 • Introducción' : `Tema ${subtemaNum}`}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({mod.lessons.length} clases)
                              </span>

                              {/* Casilla rápida para marcar o desmarcar este Tema como Tema 0 */}
                              <button
                                type="button"
                                onClick={() => {
                                  const res = toggleModuleSubtemaZero(
                                    activeCourse.id,
                                    mod.id
                                  );
                                  setBannerMsg(res.message);
                                }}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold transition ${
                                  isZero
                                    ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30'
                                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300'
                                }`}
                                title="Activar o desactivar como Tema 0 de Introducción"
                              >
                                {isZero
                                  ? '✓ Es Tema 0 (Quitar 0)'
                                  : 'Marcar como Tema 0'}
                              </button>
                            </div>

                            {editingModuleId === mod.id ? (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  value={editingModuleTitle}
                                  onChange={(e) => setEditingModuleTitle(e.target.value)}
                                  className="flex-1 rounded-xl border border-amber-500 bg-slate-900 px-3 py-1.5 text-sm font-bold text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const res = renameModuleInCourse(
                                      activeCourse.id,
                                      mod.id,
                                      editingModuleTitle
                                    );
                                    setBannerMsg(res.message);
                                    setEditingModuleId(null);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-slate-950"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingModuleId(null)}
                                  className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-extrabold text-white">
                                  {mod.title}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingModuleId(mod.id);
                                    setEditingModuleTitle(mod.title);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Renombrar Tema
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Controles del Tema: Elegir videos de Bunny, Ordenar 0-9/A-Z, Subir, Bajar, Borrar */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPickerModuleId(isPickerOpen ? null : mod.id);
                                setCheckedBunnyGuids([]);
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-500/30"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {isPickerOpen
                                ? 'Cerrar selector'
                                : 'Meter videos de Bunny aquí'}
                            </button>

                            {mod.lessons.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const res = sortModuleLessonsAlphabetically(
                                    activeCourse.id,
                                    mod.id
                                  );
                                  setBannerMsg(res.message);
                                }}
                                title="Ordenar las clases de este tema en orden numérico y alfabético (0-9 / A-Z)"
                                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:border-amber-500/40 hover:text-amber-300"
                              >
                                Ordenar 0-9 / A-Z
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={modIndex === 0}
                              onClick={() =>
                                reorderModuleInCourse(activeCourse.id, mod.id, 'up')
                              }
                              title="Subir este tema"
                              className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={modIndex === activeCourse.modules.length - 1}
                              onClick={() =>
                                reorderModuleInCourse(activeCourse.id, mod.id, 'down')
                              }
                              title="Bajar este tema"
                              className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>

                            {activeCourse.modules.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  deleteModuleFromCourse(activeCourse.id, mod.id)
                                }
                                title="Eliminar este tema"
                                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:border-rose-500/40 hover:text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* CAJA DESPLEGABLE: Seleccionar ÚNICAMENTE videos SUELTOS / NUEVOS de Bunny (ordenados 0-9 / A-Z) */}
                        {isPickerOpen && (
                          <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-emerald-200">
                                  Videos Sueltos / Nuevos para meter en &ldquo;{mod.title}&rdquo; ({unassignedBunnyVideos.length}):
                                </span>
                                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                                  Ordenados 0-9 / A-Z
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                {unassignedBunnyVideos.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        checkedBunnyGuids.length ===
                                        unassignedBunnyVideos.length
                                      ) {
                                        setCheckedBunnyGuids([]);
                                      } else {
                                        setCheckedBunnyGuids(
                                          unassignedBunnyVideos.map((v) => v.guid)
                                        );
                                      }
                                    }}
                                    className="text-xs font-bold text-emerald-300 hover:underline"
                                  >
                                    {checkedBunnyGuids.length ===
                                    unassignedBunnyVideos.length
                                      ? 'Desmarcar todos'
                                      : 'Seleccionar todos en orden'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setPickerModuleId(null)}
                                  className="text-xs text-slate-400 hover:text-white"
                                >
                                  Cerrar
                                </button>
                              </div>
                            </div>

                            {unassignedBunnyVideos.length === 0 ? (
                              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-center text-xs text-slate-300">
                                ✨ <strong>No tienes videos sueltos sin asignar.</strong> Todos los videos de tu Bunny Stream ya están colocados en algún tema.
                                <div className="mt-1 text-[11px] text-slate-400">
                                  Si subes nuevos videos a Bunny (y presionas &ldquo;Buscar Nuevos&rdquo;) o si quitas un video de otro tema con el ícono de papelera 🗑️, aparecerá aquí ordenado automáticamente (0-9 / A-Z).
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                                  {unassignedBunnyVideos.map((bv, bvIdx) => {
                                    const isChecked = checkedBunnyGuids.includes(bv.guid);
                                    return (
                                      <label
                                        key={bv.guid}
                                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs hover:border-emerald-500/50"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setCheckedBunnyGuids((prev) => [
                                                  ...prev,
                                                  bv.guid,
                                                ]);
                                              } else {
                                                setCheckedBunnyGuids((prev) =>
                                                  prev.filter((id) => id !== bv.guid)
                                                );
                                              }
                                            }}
                                            className="h-4 w-4 rounded accent-emerald-500"
                                          />
                                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                                            #{bvIdx + 1}
                                          </span>
                                          <span className="font-semibold text-white">
                                            {bv.title.replace(/\.mp4$/i, '')}
                                          </span>
                                        </div>
                                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                          Video Suelto / Nuevo
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>

                                <div className="mt-3 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleBatchAssignToSubtema(mod.id)}
                                    disabled={checkedBunnyGuids.length === 0}
                                    className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-40"
                                  >
                                    Guardar {checkedBunnyGuids.length} video(s) en orden en este Tema
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Videos / Clases dentro de este Tema */}
                        {mod.lessons.length === 0 ? (
                          <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
                            Este tema aún no tiene videos. Haz clic en{' '}
                            <strong className="text-emerald-300">
                              &ldquo;+ Meter videos de Bunny aquí&rdquo;
                            </strong>{' '}
                            o asígnalos desde la columna derecha.
                          </div>
                        ) : (
                          <ul className="mt-3.5 space-y-2">
                            {mod.lessons.map((les, lesIdx) => (
                              <li
                                key={les.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-900/70 px-3.5 py-2.5 text-xs"
                              >
                                {editingLessonId === les.id ? (
                                  <div className="flex w-full items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingLessonTitle}
                                      onChange={(e) =>
                                        setEditingLessonTitle(e.target.value)
                                      }
                                      className="flex-1 rounded-lg border border-amber-500 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = renameLessonInCourse(
                                          activeCourse.id,
                                          mod.id,
                                          les.id,
                                          editingLessonTitle
                                        );
                                        setBannerMsg(res.message);
                                        setEditingLessonId(null);
                                      }}
                                      className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-slate-950"
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingLessonId(null)}
                                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2.5 text-slate-200">
                                      <Video className="h-4 w-4 shrink-0 text-emerald-400" />
                                      <span className="font-semibold text-white">
                                        {les.title}
                                      </span>
                                      <span className="text-[11px] text-slate-500">
                                        ({les.duration_minutes}m)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingLessonId(les.id);
                                          setEditingLessonTitle(les.title);
                                        }}
                                        title="Renombrar esta clase"
                                        className="text-slate-400 hover:text-amber-300"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                    </div>

                                    {/* Acciones por video: Mover a otro Tema + Subir/Bajar + Quitar */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {activeCourse.modules.length > 1 && (
                                        <select
                                          aria-label="Mover clase a otro tema"
                                          value={mod.id}
                                          onChange={(e) => {
                                            const res = moveLessonToModule(
                                              activeCourse.id,
                                              les.id,
                                              e.target.value
                                            );
                                            setBannerMsg(res.message);
                                          }}
                                          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-medium text-slate-300 focus:border-amber-500 focus:outline-none"
                                          title="Cambiar este video a otro Tema"
                                        >
                                          {activeCourse.modules.map((m, idx) => (
                                            <option key={m.id} value={m.id}>
                                              Tema {getSubtemaNumber(activeCourse.modules, idx)}: {m.title.slice(0, 26)}
                                            </option>
                                          ))}
                                        </select>
                                      )}

                                      <button
                                        type="button"
                                        disabled={lesIdx === 0}
                                        onClick={() =>
                                          reorderLessonInModule(
                                            activeCourse.id,
                                            mod.id,
                                            les.id,
                                            'up'
                                          )
                                        }
                                        title="Subir clase"
                                        className="rounded bg-slate-800 p-1 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
                                      >
                                        <ArrowUp className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={lesIdx === mod.lessons.length - 1}
                                        onClick={() =>
                                          reorderLessonInModule(
                                            activeCourse.id,
                                            mod.id,
                                            les.id,
                                            'down'
                                          )
                                        }
                                        title="Bajar clase"
                                        className="rounded bg-slate-800 p-1 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
                                      >
                                        <ArrowDown className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          deleteLessonFromCourse(
                                            activeCourse.id,
                                            mod.id,
                                            les.id
                                          )
                                        }
                                        title="Quitar video de este tema"
                                        className="rounded bg-slate-800 p-1 text-slate-400 hover:text-rose-400"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA (5 COLS): BANDEJA EXCLUSIVA DE VIDEOS SUELTOS / NUEVOS DE BUNNY STREAM (#808934) */}
            <div className="space-y-6 lg:col-span-5">
              <div className="sticky top-28 rounded-3xl border border-emerald-500/40 bg-slate-900/95 p-6 shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                      Bunny.net Stream (#808934) • Ordenados 0-9 / A-Z
                    </span>
                    <h3 className="mt-0.5 text-lg font-bold text-white">
                      Videos Sueltos / Nuevos ({unassignedBunnyVideos.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={fetchBunnyLibrary}
                    disabled={loadingBunny}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${loadingBunny ? 'animate-spin' : ''}`}
                    />
                    Buscar Nuevos
                  </button>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Aquí <strong>solo aparecen los videos nuevos o sueltos</strong> que todavía no están colocados en ningún curso ni tema, <strong>ordenados numérica y alfabéticamente</strong>:
                </p>

                {unassignedBunnyVideos.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-800 bg-slate-950/80 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                    <div className="mt-2 text-sm font-bold text-white">
                      ¡Todos tus videos ya están organizados en Temas!
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      Actualmente tienes <strong>{bunnyVideos.length} videos</strong> en Bunny y todos están asignados. Cuando subas un video nuevo a Bunny (y presiones <strong>&ldquo;Buscar Nuevos&rdquo;</strong>) o quites un video de un tema (🗑️), aparecerá aquí en orden.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
                    {unassignedBunnyVideos.map((bv, bvIdx) => (
                      <div
                        key={bv.guid}
                        className="rounded-2xl border border-amber-500/30 bg-slate-950/90 p-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                              #{bvIdx + 1}
                            </span>
                            <span>{bv.title.replace(/\.mp4$/i, '')}</span>
                          </div>
                          <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            Video Suelto
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">
                            Enviar al Tema:
                          </span>
                          <select
                            aria-label="Asignar video suelto a un tema"
                            value=""
                            onChange={(e) => {
                              const destModId = e.target.value;
                              if (!destModId) return;
                              const res = assignBunnyVideosToSubtema(
                                activeCourse.id,
                                destModId,
                                [bv]
                              );
                              setBannerMsg(res.message);
                            }}
                            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="" disabled>
                              -- Elegir Tema destino --
                            </option>
                            {activeCourse.modules.map((m, idx) => (
                              <option key={m.id} value={m.id}>
                                Tema {getSubtemaNumber(activeCourse.modules, idx)}: {m.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: GESTIÓN DE ACADEMIAS Y PAQUETES DE LICENCIAS
      ===================================================================== */}
      {activeTab === 'tenants' && (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <h2 className="text-lg font-bold text-white">
              Academias Activas y Asignación de Licencias / Cursos
            </h2>

            {tenants.map((tenant) => {
              const usagePercent = Math.min(
                100,
                Math.round((tenant.used_licenses / Math.max(1, tenant.max_licenses)) * 100)
              );

              return (
                <div
                  key={tenant.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white shadow-md"
                        style={{ backgroundColor: tenant.primary_color }}
                      >
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{tenant.name}</h3>
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                            {tenant.plan_status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Subdominio: <strong className="text-slate-200">{tenant.slug}.lms.com</strong>
                          {tenant.custom_domain && (
                            <>
                              {' '}• Dominio propio:{' '}
                              <strong className="text-slate-200">{tenant.custom_domain}</strong>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        selectTenantById(tenant.id);
                        router.push('/reseller');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                    >
                      Abrir Panel de esta Academia
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-300">
                        Cupo de Licencias ({tenant.plan_name}):
                      </span>
                      <span className="font-bold text-white">
                        {tenant.used_licenses} activas de {tenant.max_licenses} contratadas ({usagePercent}%)
                      </span>
                    </div>

                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${usagePercent}%`,
                          backgroundColor:
                            usagePercent >= 90 ? '#F43F5E' : tenant.primary_color,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        Modificar paquete de licencias:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[5, 25, 100, 500].map((pack) => (
                          <button
                            key={pack}
                            type="button"
                            onClick={() => {
                              updateTenantLicenseLimit(
                                tenant.id,
                                pack,
                                `Pack Reseller ${pack} Alumnos`
                              );
                              setBannerMsg(
                                `Se asignó el paquete de ${pack} licencias a "${tenant.name}".`
                              );
                            }}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                              tenant.max_licenses === pack
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {pack} Lic.
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-400">
                      Cursos asignados a este Reseller:
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {courses.map((course) => {
                        const isAssigned = course.assigned_tenant_ids.includes(tenant.id);
                        return (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => toggleCourseForTenant(tenant.id, course.id)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                              isAssigned
                                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                                : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <CheckCircle2
                              className={`h-3.5 w-3.5 ${
                                isAssigned ? 'text-emerald-400' : 'text-slate-600'
                              }`}
                            />
                            {course.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <div className="flex items-center gap-2.5">
                <Plus className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">
                  Dar de Alta Nueva Academia / Reseller
                </h2>
              </div>

              <form onSubmit={handleCreateTenantSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Nombre Comercial de la Academia *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTenantName}
                    onChange={(e) => {
                      setNewTenantName(e.target.value);
                      if (!newTenantSlug) {
                        setNewTenantSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')
                        );
                      }
                    }}
                    placeholder="Ej: Escuela de Closers Latam"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Subdominio (Slug) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTenantSlug}
                      onChange={(e) => setNewTenantSlug(e.target.value)}
                      placeholder="closers-latam"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Dominio Personalizado
                    </label>
                    <input
                      type="text"
                      value={newTenantDomain}
                      onChange={(e) => setNewTenantDomain(e.target.value)}
                      placeholder="campus.cliente.com"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Color Primario de Marca
                    </label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="color"
                        value={newTenantColor}
                        onChange={(e) => setNewTenantColor(e.target.value)}
                        className="h-10 w-12 cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-1"
                      />
                      <input
                        type="text"
                        value={newTenantColor}
                        onChange={(e) => setNewTenantColor(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Paquete de Licencias
                    </label>
                    <select
                      value={newTenantLicenses}
                      onChange={(e) => setNewTenantLicenses(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                    >
                      <option value={5}>Pack Inicial (5 Alumnos)</option>
                      <option value={25}>Pack Reseller Pro (25 Alumnos)</option>
                      <option value={100}>Pack Corporativo (100 Alumnos)</option>
                      <option value={500}>Pack Enterprise (500 Alumnos)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-amber-400"
                >
                  Crear Academia y Activar Paquete de Licencias
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: PAGOS STRIPE / MERCADO PAGO
      ===================================================================== */}
      {activeTab === 'webhooks' && (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-lg font-bold text-white">
                Simulador de Eventos de Pago en Tiempo Real
              </h2>
              <div className="mt-4 space-y-2.5">
                {tenants.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{t.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Cupo actual: {t.used_licenses}/{t.max_licenses} licencias
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerSimulatedWebhook('stripe', t.id, 10);
                          setBannerMsg(
                            `Webhook Stripe procesado: +10 licencias añadidas a ${t.name}.`
                          );
                        }}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                      >
                        +10 Lic. (Stripe)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerSimulatedWebhook('mercadopago', t.id, 25);
                          setBannerMsg(
                            `Webhook Mercado Pago procesado: +25 licencias añadidas a ${t.name}.`
                          );
                        }}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
                      >
                        +25 Lic. (Mercado Pago)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-lg font-bold text-white">
                Historial de Eventos de Suscripción (`subscription_events`)
              </h2>
              <div className="mt-4 space-y-3">
                {webhookLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/90 p-4"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 font-bold uppercase text-indigo-300">
                        {log.provider}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {log.external_event_id}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {log.summary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
