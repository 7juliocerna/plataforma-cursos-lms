'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BunnyRemoteVideo, useLMS } from '@/context/LMSContext';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  Filter,
  FolderKanban,
  FolderPlus,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
  Video,
  Wand2,
  X,
} from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const {
    academies,
    createAcademy,
    updateAcademy,
    courses,
    webhookLogs,
    globalPaymentSettings,
    updateGlobalPaymentSettings,
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
  } = useLMS();

  const [activeTab, setActiveTab] = useState<'courses' | 'academies' | 'payments'>('courses');
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Formulario de pagos global
  const [paymentForm, setPaymentForm] = useState(globalPaymentSettings);
  useEffect(() => {
    setPaymentForm(globalPaymentSettings);
  }, [globalPaymentSettings]);

  // Curso actualmente seleccionado en el Constructor de Subtemas
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ''
  );

  const activeCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  // Asegurar que si cambia el listado de cursos y no hay seleccionado, se seleccione el primero
  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

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

  // Buscador y Filtro para la Bandeja de Videos de Bunny
  const [bunnySearchQuery, setBunnySearchQuery] = useState('');
  const [bunnyFilterTab, setBunnyFilterTab] = useState<'unassigned' | 'all'>('unassigned');
  const [batchTargetModuleId, setBatchTargetModuleId] = useState<string>('');

  // Estado para el Wizard de Crear Curso Nuevo
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSubtitle, setCourseSubtitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('Productividad & Software');
  const [courseLevel, setCourseLevel] = useState('Todos los niveles');
  const [courseDuration, setCourseDuration] = useState('6 horas');
  const [courseAcademyId, setCourseAcademyId] = useState('');
  const [starterTemplate, setStarterTemplate] = useState<'standard' | 'blank'>('standard');
  const [customFirstModule, setCustomFirstModule] = useState('Tema 1: Fundamentos');

  // Estado formulario Crear Nueva Academia Temática
  const [newAcademyTitle, setNewAcademyTitle] = useState('');
  const [newAcademySlug, setNewAcademySlug] = useState('');
  const [newAcademyDesc, setNewAcademyDesc] = useState('');
  const [newAcademyColor, setNewAcademyColor] = useState('#1D4ED8');
  const [newAcademyPriceMonthly, setNewAcademyPriceMonthly] = useState(19);
  const [newAcademyPriceAnnual, setNewAcademyPriceAnnual] = useState(149);

  // Cargar automáticamente la lista de videos de Bunny al entrar al panel
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

  // Crear Subtema en el curso activo
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

  // Asignar videos seleccionados a un subtema
  const handleBatchAssignToSubtema = (targetModId: string) => {
    if (!activeCourse || !targetModId) return;
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
      targetModId,
      selectedObjs
    );
    setBannerMsg(res.message);
    if (res.ok) {
      setCheckedBunnyGuids([]);
      setPickerModuleId(null);
    }
  };

  // Enviar un video individual directamente a un subtema
  const handleAssignSingleVideo = (video: BunnyRemoteVideo, targetModId: string) => {
    if (!activeCourse || !targetModId) return;
    const res = assignBunnyVideosToSubtema(activeCourse.id, targetModId, [video]);
    setBannerMsg(res.message);
  };

  // Envío del Wizard de Creación de Curso
  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;

    let initialModules: { title: string; is_subtema_zero?: boolean; description?: string }[] = [];

    if (starterTemplate === 'standard') {
      initialModules = [
        {
          title: '00. Introducción, Bienvenida y Recursos',
          is_subtema_zero: true,
          description: 'Visión general del programa y archivos descargables de trabajo.',
        },
        {
          title: '01. Fundamentos y Primeras Prácticas',
          is_subtema_zero: false,
          description: 'Aprende los conceptos esenciales paso a paso.',
        },
        {
          title: '02. Casos Prácticos y Proyecto Final',
          is_subtema_zero: false,
          description: 'Aplica todo lo aprendido en ejercicios del mundo real.',
        },
      ];
    } else {
      initialModules = [
        {
          title: customFirstModule.trim() || 'Tema 1: Fundamentos',
          is_subtema_zero: false,
          description: 'Primer bloque temático del curso.',
        },
      ];
    }

    const targetAcademyId = courseAcademyId || academies[0]?.id;

    const res = createCourse({
      academy_id: targetAcademyId,
      title: courseTitle.trim(),
      subtitle: courseSubtitle.trim() || 'Domina cada habilidad con lecciones en video paso a paso.',
      description: courseSubtitle.trim() || courseTitle.trim(),
      category: courseCategory,
      level: courseLevel,
      duration_label: courseDuration,
      initial_modules: initialModules,
    });

    setBannerMsg(res.message);
    if (res.ok && res.courseId) {
      setSelectedCourseId(res.courseId);
      setCourseTitle('');
      setCourseSubtitle('');
      setWizardStep(1);
      setShowNewCourseModal(false);
    }
  };

  const handleCreateAcademySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createAcademy({
      title: newAcademyTitle,
      slug: newAcademySlug,
      description: newAcademyDesc,
      primary_color: newAcademyColor,
      price_monthly: Number(newAcademyPriceMonthly),
      price_annual: Number(newAcademyPriceAnnual),
    });
    setBannerMsg(res.message);
    if (res.ok) {
      setNewAcademyTitle('');
      setNewAcademySlug('');
      setNewAcademyDesc('');
    }
  };

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateGlobalPaymentSettings(paymentForm);
    setBannerMsg('Configuración global de pagos guardada con éxito.');
  };

  // Mapa global de todos los videos que YA están ubicados en algún curso/subtema
  const allAssignedVideoGuids = useMemo(() => {
    const set = new Set<string>();
    for (const c of courses) {
      for (const mod of c.modules) {
        for (const les of mod.lessons) {
          set.add(les.video_id);
        }
      }
    }
    return set;
  }, [courses]);

  // Mapa de video GUID a información de ubicación (curso y tema)
  const videoPlacementMap = useMemo(() => {
    const map = new Map<string, { courseTitle: string; moduleTitle: string; isCurrentCourse: boolean }>();
    for (const c of courses) {
      for (const mod of c.modules) {
        for (const les of mod.lessons) {
          map.set(les.video_id, {
            courseTitle: c.title,
            moduleTitle: mod.title,
            isCurrentCourse: activeCourse ? c.id === activeCourse.id : false,
          });
        }
      }
    }
    return map;
  }, [courses, activeCourse]);

  // Lista de videos sin asignar
  const unassignedBunnyVideos = useMemo(() => {
    return [...bunnyVideos]
      .filter((bv) => !allAssignedVideoGuids.has(bv.guid))
      .sort((a, b) =>
        String(a.title || '').localeCompare(String(b.title || ''), 'es', {
          numeric: true,
          sensitivity: 'base',
        })
      );
  }, [bunnyVideos, allAssignedVideoGuids]);

  // Lista filtrada según búsqueda y tab seleccionado
  const filteredBunnyVideos = useMemo(() => {
    const baseList = bunnyFilterTab === 'unassigned' ? unassignedBunnyVideos : bunnyVideos;
    if (!bunnySearchQuery.trim()) return baseList;
    const q = bunnySearchQuery.toLowerCase();
    return baseList.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.guid.toLowerCase().includes(q)
    );
  }, [bunnyFilterTab, unassignedBunnyVideos, bunnyVideos, bunnySearchQuery]);

  // Calcula el número correlativo de cada Subtema (0 si es subtema zero)
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

  // Encuentra la academia del curso activo
  const activeCourseAcademy = useMemo(() => {
    if (!activeCourse) return null;
    return academies.find(
      (a) => a.id === activeCourse.academy_id || activeCourse.assigned_tenant_ids?.includes(a.id)
    );
  }, [activeCourse, academies]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* =====================================================================
          ENCABEZADO EJECUTIVO SUPERADMIN (BENTO DESIGN SYSTEM)
      ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs md:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
            <Crown className="h-3.5 w-3.5 text-blue-700" />
            ADMINISTRADOR • CONSTRUCTOR DE CURSOS & BIBLIOTECA BUNNY
          </div>
          <h1 className="mt-2.5 text-2xl font-extrabold text-[#1E293B] sm:text-3xl">
            Gestor de Cursos y Temarios Multimedia
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#64748B]">
            Crea cursos con asistentes guiados, estructura módulos ilimitados y distribuye tus <strong>79 videos de Bunny Stream</strong> con un solo clic.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === 'courses'
                ? 'bg-slate-900 text-white'
                : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <FolderKanban className="h-4 w-4" />
            Constructor de Cursos ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('academies')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === 'academies'
                ? 'bg-slate-900 text-white'
                : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Academias Temáticas ({academies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === 'payments'
                ? 'bg-slate-900 text-white'
                : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Configuración Global de Pagos
          </button>
        </div>
      </div>

      {/* Banner de Notificación */}
      {bannerMsg && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-sm text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="font-semibold">{bannerMsg}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/student')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver en Aula Alumno →
            </button>
            <button
              type="button"
              onClick={() => setBannerMsg(null)}
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 1: CONSTRUCTOR VISUAL DE CURSOS Y ORGANIZADOR DE BUNNY STREAM
      ===================================================================== */}
      {activeTab === 'courses' && activeCourse && (
        <div className="mt-7 space-y-6">
          {/* BARRA SUPERIOR: SELECTOR DE CURSO + BOTÓN CREAR CURSO + VISTA PREVIA ALUMNO */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#64748B]">
                Curso activo:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {courses.map((course) => {
                  const isSelected = course.id === activeCourse.id;
                  const acad = academies.find(
                    (a) => a.id === course.academy_id || course.assigned_tenant_ids?.includes(a.id)
                  );
                  const totalCourseLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setPickerModuleId(null);
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs ${
                        isSelected
                          ? 'bg-[#1E293B] text-white ring-2 ring-blue-500/30'
                          : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#1E293B] hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {acad && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: acad.primary_color }}
                          title={`Academia: ${acad.title}`}
                        />
                      )}
                      <span>{course.title}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#64748B]'
                        }`}
                      >
                        {course.modules.length}T • {totalCourseLessons}v
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push('/student')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-bold text-[#1E293B] transition hover:bg-[#F8FAFC] shadow-xs"
                title="Abrir el aula virtual para probar la experiencia del estudiante"
              >
                <Eye className="h-4 w-4 text-blue-600" />
                <span>Vista Alumno</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowNewCourseModal(true);
                  setWizardStep(1);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Crear Nuevo Curso
              </button>
            </div>
          </div>

          {/* =================================================================
              MODAL WIZARD ERGONÓMICO: CREAR CURSO MAESTRO (BENTO 2 PASOS)
          ================================================================= */}
          {showNewCourseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-2xl rounded-3xl border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-2xl">
                {/* Header del Modal */}
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                      <Wand2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#1E293B]">
                        Asistente para Crear Nuevo Curso
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        Paso {wizardStep} de 2: {wizardStep === 1 ? 'Ficha e Identidad del Curso' : 'Estructura Inicial de Temas'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCourseModal(false)}
                    className="rounded-xl p-1.5 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Contenido del Paso 1: Ficha del Curso */}
                {wizardStep === 1 && (
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                        1. Nombre del Curso *
                      </label>
                      <input
                        type="text"
                        required
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        placeholder="Ej: Master en Edición y Retoque Profesional con Photoshop"
                        className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#1E293B] placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                        2. Promesa de Transformación / Subtítulo *
                      </label>
                      <input
                        type="text"
                        required
                        value={courseSubtitle}
                        onChange={(e) => setCourseSubtitle(e.target.value)}
                        placeholder="Ej: Domina capas, modos de fusión y retoque comercial paso a paso."
                        className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#1E293B] placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                        3. Selecciona la Academia Temática *
                      </label>
                      <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        {academies.map((acad) => {
                          const isSelected = (courseAcademyId || academies[0]?.id) === acad.id;
                          return (
                            <button
                              key={acad.id}
                              type="button"
                              onClick={() => setCourseAcademyId(acad.id)}
                              className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-600/20'
                                  : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: acad.primary_color }}
                                />
                                <span className="text-xs font-extrabold text-[#1E293B]">
                                  {acad.title}
                                </span>
                              </div>
                              <span className="mt-1 text-[11px] text-[#64748B] line-clamp-1">
                                {acad.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                          Nivel
                        </label>
                        <select
                          value={courseLevel}
                          onChange={(e) => setCourseLevel(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-semibold text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                        >
                          <option value="Todos los niveles">Todos los niveles</option>
                          <option value="Principiante">Principiante</option>
                          <option value="Intermedio">Intermedio</option>
                          <option value="Avanzado">Avanzado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                          Categoría
                        </label>
                        <input
                          type="text"
                          value={courseCategory}
                          onChange={(e) => setCourseCategory(e.target.value)}
                          placeholder="Diseño Gráfico"
                          className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-semibold text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                          Duración Estimada
                        </label>
                        <input
                          type="text"
                          value={courseDuration}
                          onChange={(e) => setCourseDuration(e.target.value)}
                          placeholder="Ej: 8 horas"
                          className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-semibold text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
                      <button
                        type="button"
                        onClick={() => setShowNewCourseModal(false)}
                        className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={!courseTitle.trim()}
                        onClick={() => setWizardStep(2)}
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-700 disabled:opacity-40"
                      >
                        Siguiente: Estructura de Temas →
                      </button>
                    </div>
                  </div>
                )}

                {/* Contenido del Paso 2: Plantilla de Temario Inicial */}
                {wizardStep === 2 && (
                  <form onSubmit={handleCreateCourseSubmit} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                        Elige cómo quieres empezar el temario:
                      </label>
                      <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* Opción 1: Plantilla Estándar */}
                        <div
                          onClick={() => setStarterTemplate('standard')}
                          className={`cursor-pointer rounded-2xl border p-4 transition ${
                            starterTemplate === 'standard'
                              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                              : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-extrabold text-[#1E293B]">
                              Plantilla Recomendada (3 Temas)
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#64748B]">
                            Crea automáticamente una estructura pedagógica lista para recibir videos:
                          </p>
                          <ul className="mt-2 space-y-1 text-[11px] text-[#1E293B]">
                            <li className="flex items-center gap-1.5 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                              Tema 0: Bienvenida e Instalación
                            </li>
                            <li className="flex items-center gap-1.5 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              Tema 1: Fundamentos y Primeros Pasos
                            </li>
                            <li className="flex items-center gap-1.5 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                              Tema 2: Casos Prácticos y Proyecto Final
                            </li>
                          </ul>
                        </div>

                        {/* Opción 2: Lienzo en Blanco */}
                        <div
                          onClick={() => setStarterTemplate('blank')}
                          className={`cursor-pointer rounded-2xl border p-4 transition ${
                            starterTemplate === 'blank'
                              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                              : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-slate-700" />
                            <span className="text-xs font-extrabold text-[#1E293B]">
                              Lienzo en Blanco (1 Tema Inicial)
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#64748B]">
                            Comienza con un solo tema personalizado y ve agregando temas a tu ritmo:
                          </p>
                          <div className="mt-2.5">
                            <input
                              type="text"
                              value={customFirstModule}
                              onChange={(e) => setCustomFirstModule(e.target.value)}
                              placeholder="Nombre del primer tema"
                              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900">
                      💡 <strong>Tip Bunny Stream:</strong> Una vez creado el curso, podrás buscar entre tus 79 videos en la columna derecha y enviarlos a cualquiera de estos temas con un solo clic.
                    </div>

                    <div className="mt-6 flex justify-between border-t border-[#E2E8F0] pt-4">
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC]"
                      >
                        ← Volver al Paso 1
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-700 shadow-sm"
                      >
                        🚀 Crear Curso y Abrir Constructor
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              ÁREA PRINCIPAL DE TRABAJO (2 COLUMNAS ERGONÓMICAS):
              Izquierda (7 cols): Constructor de Temas del Curso Activo
              Derecha (5 cols): Bandeja de Videos de Bunny Stream (#808934)
          ================================================================= */}
          <div className="grid gap-8 lg:grid-cols-12">
            {/* ===============================================================
                COLUMNA IZQUIERDA (7 COLS): CONSTRUCTOR VISUAL DE TEMAS
            =============================================================== */}
            <div className="space-y-6 lg:col-span-7">
              <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
                {/* Cabecera del Curso Activo con edición de título */}
                <div className="border-b border-[#E2E8F0] pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                        Estructura del Curso Activo
                      </span>
                      {activeCourseAcademy && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: activeCourseAcademy.primary_color }}
                        >
                          {activeCourseAcademy.title}
                        </span>
                      )}
                      <span className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-semibold text-[#64748B]">
                        {activeCourse.level} • {activeCourse.duration_label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingCourseId(activeCourse.id);
                        setEditingCourseTitle(activeCourse.title);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-semibold text-[#64748B] hover:border-slate-300 hover:text-[#1E293B]"
                    >
                      <Pencil className="h-3 w-3" />
                      Renombrar
                    </button>
                  </div>

                  {editingCourseId === activeCourse.id ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editingCourseTitle}
                        onChange={(e) => setEditingCourseTitle(e.target.value)}
                        className="flex-1 rounded-xl border border-blue-600 bg-white px-3.5 py-2 text-base font-bold text-[#1E293B] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const res = renameCourse(activeCourse.id, editingCourseTitle);
                          setBannerMsg(res.message);
                          setEditingCourseId(null);
                        }}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCourseId(null)}
                        className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#64748B]"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <h2 className="mt-1.5 text-xl font-extrabold text-[#1E293B]">
                      {activeCourse.title}
                    </h2>
                  )}

                  <p className="mt-1 text-xs text-[#64748B]">
                    {activeCourse.subtitle}
                  </p>
                </div>

                {/* FORMULARIO RÁPIDO PARA CREAR NUEVO TEMA EN ESTE CURSO */}
                <form
                  onSubmit={handleCreateSubtema}
                  className="mt-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-900">
                      <FolderPlus className="h-4 w-4 text-blue-700" />
                      Agregar un Nuevo Tema al Temario:
                    </label>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-900 transition hover:bg-cyan-100">
                      <input
                        type="checkbox"
                        checked={newSubtemaIsZero}
                        onChange={(e) => setNewSubtemaIsZero(e.target.checked)}
                        className="h-3.5 w-3.5 rounded accent-cyan-600"
                      />
                      Marcar como Tema 0 (Introducción / Bienvenida)
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
                          ? 'Ej: 00. Bienvenida, Instalación de Programas y Recursos'
                          : 'Ej: 03. Herramientas de Selección y Máscaras Avanzadas'
                      }
                      className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#1E293B] placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-700 shadow-xs"
                    >
                      <Plus className="h-4 w-4" />
                      {newSubtemaIsZero ? 'Crear Tema 0' : 'Crear Tema'}
                    </button>
                  </div>
                </form>

                {/* LISTADO DE TEMAS DEL CURSO */}
                <div className="mt-6 space-y-4">
                  {activeCourse.modules.map((mod, modIndex) => {
                    const isPickerOpen = pickerModuleId === mod.id;
                    const subtemaNum = getSubtemaNumber(activeCourse.modules, modIndex);
                    const isZero = Boolean(mod.is_subtema_zero);
                    const totalModMinutes = mod.lessons.reduce((acc, l) => acc + l.duration_minutes, 0);

                    return (
                      <div
                        key={mod.id}
                        className={`rounded-2xl border p-5 shadow-xs transition ${
                          isZero
                            ? 'border-cyan-200 bg-cyan-50/20'
                            : 'border-[#E2E8F0] bg-white'
                        }`}
                      >
                        {/* Cabecera del Tema */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                  isZero
                                    ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {isZero ? 'Tema 0 • Introducción' : `Tema ${subtemaNum}`}
                              </span>
                              <span className="text-xs font-semibold text-[#64748B]">
                                ({mod.lessons.length} {mod.lessons.length === 1 ? 'clase' : 'clases'} • {totalModMinutes} min)
                              </span>

                              {/* Conmutador Tema 0 */}
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
                                    ? 'border-cyan-300 bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                                    : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B]'
                                }`}
                                title="Activar o desactivar como Tema 0 de Introducción"
                              >
                                {isZero ? '✓ Es Tema 0 (Quitar 0)' : 'Marcar como Tema 0'}
                              </button>
                            </div>

                            {/* Título editable del Tema */}
                            {editingModuleId === mod.id ? (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  value={editingModuleTitle}
                                  onChange={(e) => setEditingModuleTitle(e.target.value)}
                                  className="flex-1 rounded-xl border border-blue-600 bg-white px-3 py-1.5 text-sm font-bold text-[#1E293B] focus:outline-none"
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
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingModuleId(null)}
                                  className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#64748B]"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-extrabold text-[#1E293B]">
                                  {mod.title}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingModuleId(mod.id);
                                    setEditingModuleTitle(mod.title);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-semibold text-[#64748B] hover:bg-white hover:text-[#1E293B]"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Renombrar
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Acciones del Tema: Meter videos, Ordenar 0-9/A-Z, Subir/Bajar, Borrar */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPickerModuleId(isPickerOpen ? null : mod.id);
                                setCheckedBunnyGuids([]);
                              }}
                              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                                isPickerOpen
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {isPickerOpen ? 'Cerrar selector' : 'Meter videos de Bunny'}
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
                                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-[11px] font-bold text-[#1E293B] hover:bg-white"
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
                              className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1.5 text-[#64748B] hover:bg-white hover:text-[#1E293B] disabled:opacity-30"
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
                              className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1.5 text-[#64748B] hover:bg-white hover:text-[#1E293B] disabled:opacity-30"
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
                                className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* CAJA DESPLEGABLE: Selector rápido para meter videos de Bunny a ESTE tema */}
                        {isPickerOpen && (
                          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-blue-900">
                                  Videos sueltos para meter en &ldquo;{mod.title}&rdquo; ({unassignedBunnyVideos.length}):
                                </span>
                                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
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
                                    className="text-xs font-bold text-blue-700 hover:underline"
                                  >
                                    {checkedBunnyGuids.length ===
                                    unassignedBunnyVideos.length
                                      ? 'Desmarcar todos'
                                      : 'Seleccionar todos'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setPickerModuleId(null)}
                                  className="text-xs text-[#64748B] hover:text-[#1E293B]"
                                >
                                  Cerrar ✕
                                </button>
                              </div>
                            </div>

                            {unassignedBunnyVideos.length === 0 ? (
                              <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-white p-4 text-center text-xs text-[#64748B]">
                                ✨ <strong>Todos los videos de tu Bunny Stream están organizados.</strong>
                                <div className="mt-1 text-[11px] text-slate-400">
                                  Si quitas un video de otro tema (🗑️) o subes videos nuevos a Bunny, aparecerán aquí para asignarlos.
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
                                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs hover:border-blue-300"
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
                                            className="h-4 w-4 rounded accent-blue-600"
                                          />
                                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-[#64748B]">
                                            #{bvIdx + 1}
                                          </span>
                                          <span className="font-semibold text-[#1E293B]">
                                            {bv.title.replace(/\.mp4$/i, '')}
                                          </span>
                                        </div>
                                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                          Suelto
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
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-40 shadow-xs"
                                  >
                                    Guardar {checkedBunnyGuids.length} video(s) en &ldquo;{mod.title}&rdquo;
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Lista de Clases asignadas al Tema */}
                        {mod.lessons.length === 0 ? (
                          <div className="mt-4 rounded-xl border border-dashed border-[#E2E8F0] p-4 text-center text-xs text-[#64748B]">
                            Este tema aún no tiene videos. Haz clic en{' '}
                            <strong className="text-blue-600">
                              &ldquo;+ Meter videos de Bunny&rdquo;
                            </strong>{' '}
                            o usa la bandeja de la derecha para asignarlos en 1 clic.
                          </div>
                        ) : (
                          <ul className="mt-3.5 space-y-2">
                            {mod.lessons.map((les, lesIdx) => (
                              <li
                                key={les.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs transition hover:bg-white"
                              >
                                {editingLessonId === les.id ? (
                                  <div className="flex w-full items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingLessonTitle}
                                      onChange={(e) =>
                                        setEditingLessonTitle(e.target.value)
                                      }
                                      className="flex-1 rounded-lg border border-blue-600 bg-white px-3 py-1.5 text-xs font-bold text-[#1E293B]"
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
                                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white"
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingLessonId(null)}
                                      className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs text-[#64748B]"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2.5 text-[#1E293B]">
                                      <Video className="h-4 w-4 shrink-0 text-blue-600" />
                                      <span className="font-semibold text-[#1E293B]">
                                        {les.title}
                                      </span>
                                      <span className="text-[11px] text-[#64748B]">
                                        ({les.duration_minutes}m)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingLessonId(les.id);
                                          setEditingLessonTitle(les.title);
                                        }}
                                        title="Renombrar clase"
                                        className="text-[#64748B] hover:text-blue-600"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                    </div>

                                    {/* Mover clase a otro Tema + Subir/Bajar + Desasignar */}
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
                                          className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-[11px] font-medium text-[#1E293B] focus:border-blue-600 focus:outline-none"
                                          title="Cambiar este video a otro Tema"
                                        >
                                          {activeCourse.modules.map((m, idx) => (
                                            <option key={m.id} value={m.id}>
                                              Tema {getSubtemaNumber(activeCourse.modules, idx)}: {m.title.slice(0, 24)}
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
                                        className="rounded border border-[#E2E8F0] bg-white p-1 text-[#64748B] hover:text-[#1E293B] disabled:opacity-30"
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
                                        className="rounded border border-[#E2E8F0] bg-white p-1 text-[#64748B] hover:text-[#1E293B] disabled:opacity-30"
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
                                        title="Quitar video de este tema (vuelve a estar suelto)"
                                        className="rounded border border-rose-200 bg-rose-50 p-1 text-rose-600 hover:bg-rose-100"
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

            {/* ===============================================================
                COLUMNA DERECHA (5 COLS): BANDEJA INTELIGENTE DE BUNNY STREAM
            =============================================================== */}
            <div className="space-y-6 lg:col-span-5">
              <div className="sticky top-24 rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
                {/* Cabecera Bunny */}
                <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                      Bunny.net Stream (#808934)
                    </span>
                    <h3 className="text-base font-extrabold text-[#1E293B]">
                      Biblioteca de Videos ({bunnyVideos.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={fetchBunnyLibrary}
                    disabled={loadingBunny}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-50 shadow-xs"
                    title="Actualizar videos desde Bunny.net"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 text-blue-600 ${loadingBunny ? 'animate-spin' : ''}`}
                    />
                    <span>Buscar Nuevos</span>
                  </button>
                </div>

                {/* BUSCADOR EN VIVO DE VIDEOS */}
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                    <input
                      type="text"
                      value={bunnySearchQuery}
                      onChange={(e) => setBunnySearchQuery(e.target.value)}
                      placeholder="Buscar por nombre o número (ej: fusión, 01, máscara)..."
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-4 py-2 text-xs font-medium text-[#1E293B] placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                    {bunnySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setBunnySearchQuery('')}
                        className="absolute right-3 top-2.5 text-xs text-[#64748B] hover:text-[#1E293B]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* TABS DE FILTRO: SUELTOS VS TODOS */}
                <div className="mt-3 flex gap-2 border-b border-[#E2E8F0] pb-3">
                  <button
                    type="button"
                    onClick={() => setBunnyFilterTab('unassigned')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      bunnyFilterTab === 'unassigned'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Sueltos / Sin Asignar ({unassignedBunnyVideos.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBunnyFilterTab('all')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      bunnyFilterTab === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Todos ({bunnyVideos.length})
                  </button>
                </div>

                {/* BARRA DE ASIGNACIÓN RÁPIDA POR LOTES */}
                {checkedBunnyGuids.length > 0 && (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                      <span>{checkedBunnyGuids.length} videos seleccionados:</span>
                      <button
                        type="button"
                        onClick={() => setCheckedBunnyGuids([])}
                        className="text-[11px] text-blue-700 hover:underline"
                      >
                        Limpiar selección
                      </button>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <select
                        aria-label="Elegir tema para asignar videos seleccionados"
                        value={batchTargetModuleId || activeCourse.modules[0]?.id || ''}
                        onChange={(e) => setBatchTargetModuleId(e.target.value)}
                        className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1E293B]"
                      >
                        {activeCourse.modules.map((m, idx) => (
                          <option key={m.id} value={m.id}>
                            Tema {getSubtemaNumber(activeCourse.modules, idx)}: {m.title.slice(0, 24)}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const target = batchTargetModuleId || activeCourse.modules[0]?.id;
                          if (target) handleBatchAssignToSubtema(target);
                        }}
                        className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 shadow-xs"
                      >
                        Asignar al Tema
                      </button>
                    </div>
                  </div>
                )}

                {/* LISTADO DE VIDEOS DE BUNNY STREAM */}
                {filteredBunnyVideos.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-[#E2E8F0] p-6 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                    <div className="mt-2 text-sm font-bold text-[#1E293B]">
                      {bunnySearchQuery
                        ? 'No se encontraron videos con ese término'
                        : '¡Todos tus videos ya están organizados en Temas!'}
                    </div>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {bunnySearchQuery
                        ? 'Prueba con otra palabra clave o limpia el buscador.'
                        : `Tienes ${bunnyVideos.length} videos en tu cuenta de Bunny y todos están repartidos en cursos.`}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3.5 max-h-[500px] space-y-2 overflow-y-auto pr-1">
                    {filteredBunnyVideos.map((bv, bvIdx) => {
                      const placement = videoPlacementMap.get(bv.guid);
                      const isChecked = checkedBunnyGuids.includes(bv.guid);

                      return (
                        <div
                          key={bv.guid}
                          className={`rounded-xl border p-3 transition ${
                            placement
                              ? 'border-[#E2E8F0] bg-white'
                              : 'border-amber-200 bg-amber-50/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCheckedBunnyGuids((prev) => [...prev, bv.guid]);
                                  } else {
                                    setCheckedBunnyGuids((prev) =>
                                      prev.filter((id) => id !== bv.guid)
                                    );
                                  }
                                }}
                                className="h-3.5 w-3.5 rounded accent-blue-600"
                              />
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-[#64748B]">
                                #{bvIdx + 1}
                              </span>
                              <span className="text-xs font-bold text-[#1E293B] line-clamp-1">
                                {bv.title.replace(/\.mp4$/i, '')}
                              </span>
                            </div>

                            {placement ? (
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  placement.isCurrentCourse
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-[#64748B]'
                                }`}
                                title={`Ubicado en: ${placement.courseTitle} → ${placement.moduleTitle}`}
                              >
                                {placement.isCurrentCourse ? 'En este curso' : 'Otro curso'}
                              </span>
                            ) : (
                              <span className="shrink-0 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                Suelto
                              </span>
                            )}
                          </div>

                          {/* Selector rápido para enviar este video a un tema del curso activo */}
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-[#64748B]">
                              Enviar a:
                            </span>
                            <select
                              aria-label="Asignar video suelto a un tema"
                              value=""
                              onChange={(e) => {
                                const targetModId = e.target.value;
                                if (targetModId) handleAssignSingleVideo(bv, targetModId);
                              }}
                              className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-medium text-[#1E293B] focus:border-blue-600 focus:outline-none"
                            >
                              <option value="" disabled>
                                -- Seleccionar Tema Destino --
                              </option>
                              {activeCourse.modules.map((m, idx) => (
                                <option key={m.id} value={m.id}>
                                  Tema {getSubtemaNumber(activeCourse.modules, idx)}: {m.title.slice(0, 26)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: GESTIÓN DE ACADEMIAS TEMÁTICAS PROPIAS (LIGHT BENTO)
      ===================================================================== */}
      {activeTab === 'academies' && (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Listado de Academias */}
          <div className="space-y-5 lg:col-span-7">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <h2 className="text-lg font-extrabold text-[#1E293B]">
                Academias Temáticas Activas ({academies.length})
              </h2>
              <p className="text-xs text-[#64748B]">
                Cada academia agrupa sus propios cursos y tiene sus propios precios de suscripción individual.
              </p>
            </div>

            {academies.map((acad) => {
              const acadCourses = courses.filter(
                (c) => c.academy_id === acad.id || c.assigned_tenant_ids?.includes(acad.id)
              );

              return (
                <div
                  key={acad.id}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs transition hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white shadow-xs"
                        style={{ backgroundColor: acad.primary_color }}
                      >
                        {acad.title.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-[#1E293B]">{acad.title}</h3>
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                            ACTIVA
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B]">
                          {acad.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const firstCourseOfAcad = acadCourses[0];
                        if (firstCourseOfAcad) {
                          setSelectedCourseId(firstCourseOfAcad.id);
                          setActiveTab('courses');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#1E293B] hover:bg-white"
                    >
                      Ver Cursos ({acadCourses.length})
                      <ExternalLink className="h-3.5 w-3.5 text-[#64748B]" />
                    </button>
                  </div>

                  {/* Precios de Suscripción Individual de esta Academia */}
                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:grid-cols-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        Precio Mensual:
                      </span>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-sm font-extrabold text-[#1E293B]">$</span>
                        <input
                          type="number"
                          value={acad.price_monthly}
                          onChange={(e) => {
                            updateAcademy(acad.id, { price_monthly: Number(e.target.value) });
                            setBannerMsg(`Precio mensual de "${acad.title}" actualizado a $${e.target.value}.`);
                          }}
                          className="w-16 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs font-bold text-[#1E293B]"
                        />
                        <span className="text-xs text-[#64748B]">/mes</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        Precio Anual:
                      </span>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-sm font-extrabold text-[#1E293B]">$</span>
                        <input
                          type="number"
                          value={acad.price_annual}
                          onChange={(e) => {
                            updateAcademy(acad.id, { price_annual: Number(e.target.value) });
                            setBannerMsg(`Precio anual de "${acad.title}" actualizado a $${e.target.value}.`);
                          }}
                          className="w-16 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs font-bold text-[#1E293B]"
                        />
                        <span className="text-xs text-[#64748B]">/año</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        Color Distintivo:
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={acad.primary_color}
                          onChange={(e) => {
                            updateAcademy(acad.id, { primary_color: e.target.value });
                          }}
                          className="h-7 w-9 cursor-pointer rounded border border-[#E2E8F0] bg-white p-0.5"
                        />
                        <span className="font-mono text-xs text-[#64748B]">{acad.primary_color}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        Cursos Adentro:
                      </span>
                      <div className="mt-1 text-sm font-extrabold text-blue-700">
                        {acadCourses.length} cursos
                      </div>
                    </div>
                  </div>

                  {/* Cursos en esta Academia */}
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-[#64748B]">
                      Cursos que pertenecen a esta Academia:
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {acadCourses.length === 0 ? (
                        <span className="text-xs text-[#64748B] italic">
                          Aún no hay cursos asignados a esta academia.
                        </span>
                      ) : (
                        acadCourses.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#1E293B]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                            {c.title}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formulario Crear Nueva Academia */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#1E293B]">
                    Crear Nueva Academia Temática
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Crea una temática nueva con su propio nombre, color y precios.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateAcademySubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Nombre de la Academia *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAcademyTitle}
                    onChange={(e) => {
                      setNewAcademyTitle(e.target.value);
                      if (!newAcademySlug) {
                        setNewAcademySlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')
                        );
                      }
                    }}
                    placeholder="Ej: Academia de Inteligencia Artificial"
                    className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Identificador (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAcademySlug}
                    onChange={(e) => setNewAcademySlug(e.target.value)}
                    placeholder="academia-ia"
                    className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Descripción Corta
                  </label>
                  <input
                    type="text"
                    value={newAcademyDesc}
                    onChange={(e) => setNewAcademyDesc(e.target.value)}
                    placeholder="Domina ChatGPT, Midjourney y Agentes Autónomos"
                    className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Color
                    </label>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <input
                        type="color"
                        value={newAcademyColor}
                        onChange={(e) => setNewAcademyColor(e.target.value)}
                        className="h-10 w-full cursor-pointer rounded-lg border border-[#E2E8F0] bg-white p-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Precio Mes ($)
                    </label>
                    <input
                      type="number"
                      required
                      value={newAcademyPriceMonthly}
                      onChange={(e) => setNewAcademyPriceMonthly(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#1E293B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Precio Año ($)
                    </label>
                    <input
                      type="number"
                      required
                      value={newAcademyPriceAnnual}
                      onChange={(e) => setNewAcademyPriceAnnual(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#1E293B]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-xs transition hover:bg-blue-700"
                >
                  Crear Academia Temática
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: CONFIGURACIÓN GLOBAL DE PAGOS (LIGHT BENTO)
      ===================================================================== */}
      {activeTab === 'payments' && (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Formulario de Configuración de Pagos */}
          <div className="space-y-6 lg:col-span-7">
            <form onSubmit={handleSavePaymentSettings} className="space-y-6">
              {/* Sección Mercado Pago */}
              <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1E293B]">
                      Pasarela Mercado Pago (Recepción Directa)
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Tus credenciales de Mercado Pago Developers para cobrar con tarjeta de crédito o débito.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Public Key (Clave Pública)
                    </label>
                    <input
                      type="text"
                      value={paymentForm.mercadopago_public_key}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          mercadopago_public_key: e.target.value,
                        }))
                      }
                      placeholder="APP_USR-xxxx-xxxx-xxxx"
                      className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 font-mono text-xs text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Access Token (Token Privado)
                    </label>
                    <input
                      type="password"
                      value={paymentForm.mercadopago_access_token}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          mercadopago_access_token: e.target.value,
                        }))
                      }
                      placeholder="APP_USR-xxxx-xxxx-xxxx"
                      className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 font-mono text-xs text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Webhook Secret
                    </label>
                    <input
                      type="text"
                      value={paymentForm.mercadopago_webhook_secret || ''}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          mercadopago_webhook_secret: e.target.value,
                        }))
                      }
                      placeholder="whsec_xxxxxx"
                      className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 font-mono text-xs text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Métodos Móviles y Bancarios */}
              <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1E293B]">
                      Pagos Móviles & Transferencias (Yape, Plin, BCP)
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Los datos que verán los alumnos cuando elijan pagar mediante QR o transferencia.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                        Número Yape
                      </label>
                      <input
                        type="text"
                        value={paymentForm.yape_phone}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            yape_phone: e.target.value,
                          }))
                        }
                        placeholder="987 654 321"
                        className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-semibold text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                        Número Plin
                      </label>
                      <input
                        type="text"
                        value={paymentForm.plin_phone}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            plin_phone: e.target.value,
                          }))
                        }
                        placeholder="987 654 321"
                        className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-semibold text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      URL de Imagen del QR Yape / Plin
                    </label>
                    <input
                      type="text"
                      value={paymentForm.yape_qr_url}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          yape_qr_url: e.target.value,
                        }))
                      }
                      placeholder="https://tudominio.com/qr-yape.png"
                      className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Información de Cuenta Bancaria & Transferencias
                    </label>
                    <textarea
                      rows={3}
                      value={paymentForm.bank_transfer_info}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          bank_transfer_info: e.target.value,
                        }))
                      }
                      placeholder="Banco BCP Soles: 191-xxxxxxx-0-xx &#10;CCI: 002-191xxxxxxxxxx &#10;Titular: Julio Cerna"
                      className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-medium text-[#1E293B] focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Precios de la Membresía All-Access */}
              <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1E293B]">
                      Precios de Membresía All-Access (Pase Total)
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      El plan estrella que otorga acceso a todas las academias temáticas presentes y futuras.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Pase Mes ($)
                    </label>
                    <input
                      type="number"
                      value={paymentForm.all_access_price_monthly}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          all_access_price_monthly: Number(e.target.value),
                        }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm font-bold text-[#1E293B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Pase Año ($)
                    </label>
                    <input
                      type="number"
                      value={paymentForm.all_access_price_annual}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          all_access_price_annual: Number(e.target.value),
                        }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm font-bold text-[#1E293B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                      Moneda Base
                    </label>
                    <select
                      value={paymentForm.currency}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          currency: e.target.value,
                        }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm font-bold text-[#1E293B]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="PEN">PEN (S/)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-blue-700"
                  >
                    Guardar Configuración Global de Pagos
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Columna Derecha: Registro de Pagos Recientes */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
              <h2 className="text-base font-extrabold text-[#1E293B]">
                Historial de Cobros y Webhooks
              </h2>
              <p className="mt-1 text-xs text-[#64748B]">
                Eventos recibidos automáticamente desde Mercado Pago o registrados manualmente.
              </p>
              <div className="mt-4 space-y-3">
                {webhookLogs.length === 0 ? (
                  <p className="text-xs text-[#64748B] italic">No hay eventos registrados aún.</p>
                ) : (
                  webhookLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold uppercase text-emerald-800">
                          {log.provider}
                        </span>
                        <span className="font-mono text-[11px] text-[#64748B]">
                          {log.external_event_id}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#1E293B]">
                        {log.summary}
                      </div>
                      <div className="mt-1 text-[11px] text-[#64748B]">
                        {new Date(log.processed_at).toLocaleString('es-ES')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
