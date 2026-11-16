'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLMS } from '@/context/LMSContext';
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  FileText,
  Flame,
  GraduationCap,
  LayoutGrid,
  MessageSquare,
  MonitorX,
  PlayCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Video,
} from 'lucide-react';

interface LessonComment {
  id: string;
  author: string;
  roleLabel: string;
  content: string;
  createdAt: string;
}

// Streams de video reales en MP4 HD de acceso público para que el reproductor funcione de verdad
const REAL_VIDEO_STREAMS: Record<string, string> = {
  'eeee1111-1111-1111-1111-111111111111':
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'eeee2222-2222-2222-2222-222222222222':
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'eeee3333-3333-3333-3333-333333333333':
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'eeee4444-4444-4444-4444-444444444444':
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
  'eeee5555-5555-5555-5555-555555555555':
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
};

const DEFAULT_VIDEO_STREAM =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

export default function StudentClassroomPage() {
  const {
    currentTenant,
    currentUser,
    tenantCourses,
    completedLessonIds,
    localSessionToken,
    isSessionDisplaced,
    displacedByDevice,
    toggleLessonCompleted,
    reclaimCurrentDeviceSession,
  } = useLMS();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Vista activa del alumno: 'campus' (Catálogo/Inicio) o 'classroom' (Reproductor de clase)
  const [studentView, setStudentView] = useState<'classroom' | 'campus'>('classroom');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [activeBottomTab, setActiveBottomTab] = useState<
    'overview' | 'resources' | 'notes' | 'comments'
  >('overview');
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [bunnyTokenKey, setBunnyTokenKey] = useState<string>('');
  const [signedBunnyEmbedUrl, setSignedBunnyEmbedUrl] = useState<string | null>(null);
  const [useFallbackHtml5Player, setUseFallbackHtml5Player] = useState<boolean>(false);
  const [showBunnySecurityHelper, setShowBunnySecurityHelper] = useState<boolean>(false);
  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>([
    'dddd1111-1111-1111-1111-111111111111',
  ]);

  // Notas personales del alumno por lección
  const [notesByLesson, setNotesByLesson] = useState<Record<string, string>>({
    'eeee1111-1111-1111-1111-111111111111':
      '• Definir el problema urgente del cliente B2B en los primeros 3 minutos.\n• Estructurar paquete de implementación + acompañamiento de 90 días.\n• Anclar el precio contra el costo de contratar un equipo interno.',
  });

  // Comentarios y preguntas reales por lección
  const [commentsByLesson, setCommentsByLesson] = useState<
    Record<string, LessonComment[]>
  >({
    'eeee1111-1111-1111-1111-111111111111': [
      {
        id: 'c-1',
        author: 'Andrés Villalba',
        roleLabel: 'Alumno Verificado',
        content:
          'Excelente estructura. Aplicamos la plantilla de la oferta con un cliente de software logístico y cerramos el piloto en $2,800 USD.',
        createdAt: 'Hace 2 días',
      },
      {
        id: 'c-2',
        author: 'Mentor Oficial de la Academia',
        roleLabel: 'Instructor',
        content:
          '¡Felicidades Andrés! Recuerda descargar la calculadora del Módulo 1 para definir el paquete de renovación anual.',
        createdAt: 'Hace 1 día',
      },
    ],
  });
  const [newCommentText, setNewCommentText] = useState('');

  const studentName = currentUser?.full_name || 'Laura Gómez';
  const studentEmail = currentUser?.email || 'laura.gomez@agencia.co';

  const activeCourse = useMemo(() => {
    if (tenantCourses.length === 0) return null;
    return (
      tenantCourses.find((c) => c.id === selectedCourseId) || tenantCourses[0]
    );
  }, [tenantCourses, selectedCourseId]);

  const allLessonsOfCourse = useMemo(() => {
    if (!activeCourse) return [];
    return activeCourse.modules.flatMap((m) => m.lessons);
  }, [activeCourse]);

  const activeLesson = useMemo(() => {
    if (allLessonsOfCourse.length === 0) return null;
    return (
      allLessonsOfCourse.find((l) => l.id === selectedLessonId) ||
      allLessonsOfCourse[0]
    );
  }, [allLessonsOfCourse, selectedLessonId]);

  const currentLessonIndex = useMemo(() => {
    if (!activeLesson) return -1;
    return allLessonsOfCourse.findIndex((l) => l.id === activeLesson.id);
  }, [allLessonsOfCourse, activeLesson]);

  const prevLesson =
    currentLessonIndex > 0 ? allLessonsOfCourse[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < allLessonsOfCourse.length - 1
      ? allLessonsOfCourse[currentLessonIndex + 1]
      : null;

  useEffect(() => {
    if (activeCourse && !selectedCourseId) {
      setSelectedCourseId(activeCourse.id);
    }
  }, [activeCourse, selectedCourseId]);

  useEffect(() => {
    if (activeLesson && !selectedLessonId) {
      setSelectedLessonId(activeLesson.id);
    }
  }, [activeLesson, selectedLessonId]);

  // Asegurar que el subtema de la clase activa se abra automáticamente en el acordeón
  useEffect(() => {
    if (activeLesson?.module_id) {
      setExpandedModuleIds((prev) =>
        prev.includes(activeLesson.module_id)
          ? prev
          : [...prev, activeLesson.module_id]
      );
    }
  }, [activeLesson?.module_id]);

  const toggleModuleAccordion = (moduleId: string) => {
    setExpandedModuleIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const areAllModulesExpanded = useMemo(() => {
    if (!activeCourse || activeCourse.modules.length === 0) return false;
    return activeCourse.modules.every((m) => expandedModuleIds.includes(m.id));
  }, [activeCourse, expandedModuleIds]);

  const handleToggleAllModules = () => {
    if (!activeCourse) return;
    if (areAllModulesExpanded) {
      setExpandedModuleIds([]);
    } else {
      setExpandedModuleIds(activeCourse.modules.map((m) => m.id));
    }
  };

  // Firmar automáticamente la URL de Bunny.net Stream si hay Token Key o consultar al servidor
  useEffect(() => {
    const savedTokenKey =
      typeof window !== 'undefined'
        ? localStorage.getItem('lms_bunny_token_key_808934') || ''
        : '';
    if (savedTokenKey && !bunnyTokenKey) {
      setBunnyTokenKey(savedTokenKey);
    }
  }, [bunnyTokenKey]);

  useEffect(() => {
    if (!activeLesson || activeLesson.video_provider !== 'bunny') {
      setSignedBunnyEmbedUrl(null);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({
      videoId: activeLesson.video_id,
      libraryId: '808934',
    });
    if (bunnyTokenKey.trim()) {
      params.set('tokenKey', bunnyTokenKey.trim());
    }
    fetch(`/api/bunny/embed-url?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.embedUrl) {
          setSignedBunnyEmbedUrl(data.embedUrl);
        }
      })
      .catch(() => {
        // Ignorar abort
      });
    return () => controller.abort();
  }, [activeLesson, bunnyTokenKey]);

  // Escuchar automáticamente cuando termina un video en el iframe de Bunny.net Stream (Player.js postMessage)
  // para marcar la palomita / check de la clase automáticamente
  useEffect(() => {
    if (!activeLesson) return;

    const handlePlayerMessage = (event: MessageEvent) => {
      try {
        const raw =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (
          raw &&
          (raw.event === 'ended' ||
            raw.type === 'ended' ||
            raw.event === 'finish')
        ) {
          if (!completedLessonIds.includes(activeLesson.id)) {
            toggleLessonCompleted(activeLesson.id);
          }
        }
      } catch {
        // Ignorar mensajes que no sean JSON del reproductor
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [activeLesson, completedLessonIds, toggleLessonCompleted]);

  const handleCompleteAndAdvance = () => {
    if (!activeLesson) return;
    if (!completedLessonIds.includes(activeLesson.id)) {
      toggleLessonCompleted(activeLesson.id);
    }
    if (nextLesson) {
      setSelectedLessonId(nextLesson.id);
    }
  };

  // Ajustar velocidad del elemento <video> real
  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const completedInCourseCount = useMemo(() => {
    return allLessonsOfCourse.filter((l) => completedLessonIds.includes(l.id))
      .length;
  }, [allLessonsOfCourse, completedLessonIds]);

  const courseProgressPercent = useMemo(() => {
    if (allLessonsOfCourse.length === 0) return 0;
    return Math.round(
      (completedInCourseCount / allLessonsOfCourse.length) * 100
    );
  }, [completedInCourseCount, allLessonsOfCourse]);

  // Descarga real de archivo de plantilla/guía para el alumno
  const handleDownloadResource = (lessonTitle: string, resourcePath: string) => {
    const fileName = resourcePath.split('/').pop() || 'Guia-Practicas.txt';
    const content = `============================================================
${currentTenant.name.toUpperCase()} — MATERIAL OFICIAL DEL ALUMNO
============================================================
Curso: ${activeCourse?.title}
Clase: ${lessonTitle}
Alumno con licencia activa: ${studentName} (${studentEmail})
Fecha de descarga: ${new Date().toLocaleDateString('es-ES')}

RESUMEN EJECUTIVO Y PLANTILLA DE TRABAJO:
1. Define el dolor principal cuantificable de tu cliente ideal.
2. Establece los 3 pilares de entrega de tu servicio o programa.
3. Aplica la estructura de garantía condicional revisada en el video.

Mis apuntes guardados en esta clase:
${notesByLesson[activeLesson?.id || ''] || '(Sin apuntes adicionales)'}
============================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.(pdf|xlsx)$/i, '')}-plantilla.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeLesson) return;
    const newEntry: LessonComment = {
      id: `com-${Date.now()}`,
      author: studentName,
      roleLabel: 'Alumno Activo',
      content: newCommentText.trim(),
      createdAt: 'Justo ahora',
    };
    setCommentsByLesson((prev) => ({
      ...prev,
      [activeLesson.id]: [newEntry, ...(prev[activeLesson.id] || [])],
    }));
    setNewCommentText('');
  };

  // BLOQUEO AUTOMÁTICO POR SESIÓN SIMULTÁNEA (ANTI-COMPARTIR CUENTA)
  if (isSessionDisplaced) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-3xl border-2 border-rose-500/60 bg-slate-900/95 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <MonitorX className="h-9 w-9" />
          </div>

          <span className="mt-4 inline-block rounded-full bg-rose-500/20 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-rose-300">
            Protección Anti-Compartir Cuenta Activa
          </span>

          <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
            Tu cuenta se ha abierto en otro dispositivo
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            Tu acceso a <strong>{currentTenant.name}</strong> es personal e intransferible. Se
            ha pausado la reproducción de tu clase porque detectamos un inicio de sesión
            simultáneo en otra ubicación.
          </p>

          <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-slate-400">Titular de la Licencia:</span>
              <strong className="text-white">
                {studentName} ({studentEmail})
              </strong>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-slate-400">Nuevo dispositivo detectado:</span>
              <strong className="text-rose-300">{displacedByDevice}</strong>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-slate-400">ID de sesión desplazada:</span>
              <code className="text-slate-400">{localSessionToken}</code>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reclaimCurrentDeviceSession}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:opacity-95"
              style={{ backgroundColor: currentTenant.primary_color }}
            >
              <ShieldCheck className="h-5 w-5" />
              Cerrar Sesión en el Otro Dispositivo y Seguir Viendo Aquí
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Sub-navegación del Portal del Alumno */}
      <div className="border-b border-slate-800/80 bg-slate-900/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStudentView('campus')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                studentView === 'campus'
                  ? 'text-white shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              style={
                studentView === 'campus'
                  ? { backgroundColor: currentTenant.primary_color }
                  : undefined
              }
            >
              <LayoutGrid className="h-4 w-4" />
              Inicio del Campus / Mis Cursos ({tenantCourses.length})
            </button>

            <button
              type="button"
              onClick={() => setStudentView('classroom')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                studentView === 'classroom'
                  ? 'text-white shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              style={
                studentView === 'classroom'
                  ? { backgroundColor: currentTenant.primary_color }
                  : undefined
              }
            >
              <PlayCircle className="h-4 w-4" />
              Reproductor de Clases
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-amber-300">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Racha: 5 días seguidos</span>
            </div>

            <button
              type="button"
              onClick={() => setShowCertificateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
            >
              <Award
                className="h-4 w-4"
                style={{ color: currentTenant.primary_color }}
              />
              Mi Certificado ({courseProgressPercent}%)
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          VISTA 1: INICIO DEL CAMPUS / MIS CURSOS (ESTILO NETFLIX / SKOOL)
      ===================================================================== */}
      {studentView === 'campus' && (
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Banner de Bienvenida del Alumno */}
          <div
            className="relative overflow-hidden rounded-3xl border border-slate-800 p-8 md:p-10"
            style={{
              background: `linear-gradient(135deg, ${currentTenant.primary_color}30, #0f172a 75%)`,
            }}
          >
            <div className="relative z-10 max-w-2xl">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: currentTenant.primary_color }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Hola de nuevo, {studentName}
              </span>

              <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
                Continúa tu formación en {currentTenant.name}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                {currentTenant.tagline}
              </p>

              {activeCourse && activeLesson && (
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setStudentView('classroom')}
                    className="inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-extrabold text-white shadow-xl transition hover:opacity-95"
                    style={{ backgroundColor: currentTenant.primary_color }}
                  >
                    <PlayCircle className="h-5 w-5" />
                    Continuar viendo: {activeLesson.title}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Grid de Cursos Habilitados en su Academia */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-white">
              Mis Programas Incluidos en la Membresía ({tenantCourses.length})
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Selecciona cualquier curso para entrar a sus temas, videos en HD y materiales descargables:
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tenantCourses.map((course) => {
                const courseLessons = course.modules.flatMap((m) => m.lessons);
                const doneCount = courseLessons.filter((l) =>
                  completedLessonIds.includes(l.id)
                ).length;
                const pct =
                  courseLessons.length > 0
                    ? Math.round((doneCount / courseLessons.length) * 100)
                    : 0;
                const isCourseComplete =
                  courseLessons.length > 0 && doneCount === courseLessons.length;

                return (
                  <div
                    key={course.id}
                    className={`flex flex-col justify-between overflow-hidden rounded-3xl border bg-slate-900/80 transition ${
                      isCourseComplete
                        ? 'border-emerald-500/50 hover:border-emerald-400'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Portada Visual del Curso */}
                      <div
                        className="relative flex h-44 flex-col justify-between p-5"
                        style={{
                          background: `linear-gradient(145deg, ${currentTenant.primary_color}45, #090d16)`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="rounded-full px-3 py-1 text-[11px] font-bold text-white"
                            style={{ backgroundColor: currentTenant.primary_color }}
                          >
                            {course.category}
                          </span>
                          {isCourseComplete ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold text-slate-950 shadow-lg">
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-emerald-400">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </span>
                              Curso Completado
                            </span>
                          ) : (
                            <span className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-medium text-slate-200 backdrop-blur-sm">
                              {course.duration_label}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                            {course.modules.length} Temas • {courseLessons.length} Clases
                          </span>
                          <h3 className="mt-1 text-lg font-extrabold text-white line-clamp-2">
                            {course.title}
                          </h3>
                        </div>
                      </div>

                      <div className="p-6">
                        <p className="text-xs leading-relaxed text-slate-400">
                          {course.subtitle}
                        </p>

                        {/* Barra de progreso del alumno en este curso */}
                        <div className="mt-5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span
                                className={`flex h-4 w-4 items-center justify-center rounded-full border transition ${
                                  isCourseComplete
                                    ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                                    : 'border-slate-600 bg-slate-950 text-transparent'
                                }`}
                              >
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </span>
                              {doneCount} de {courseLessons.length} clases completadas
                            </span>
                            <strong
                              className={
                                isCourseComplete ? 'text-emerald-400' : 'text-white'
                              }
                            >
                              {pct}%
                            </strong>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: isCourseComplete
                                  ? '#10B981'
                                  : currentTenant.primary_color,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 p-5 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          const firstLesson = course.modules[0]?.lessons[0];
                          if (firstLesson) setSelectedLessonId(firstLesson.id);
                          setStudentView('classroom');
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold text-white shadow transition hover:opacity-95"
                        style={{
                          backgroundColor: isCourseComplete
                            ? '#10B981'
                            : currentTenant.primary_color,
                        }}
                      >
                        {isCourseComplete ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Curso Completado ✓ (Repasar Clases)
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4" />
                            {pct > 0 ? 'Continuar Curso' : 'Empezar Curso Ahora'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VISTA 2: REPRODUCTOR DE CLASES REAL (AULA VIRTUAL)
      ===================================================================== */}
      {studentView === 'classroom' && activeCourse && activeLesson && (
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Barra superior de selección de Curso y Progreso con Círculo Check de Avance */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/75 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Curso actual:</span>
              <select
                aria-label="Cambiar de curso"
                value={activeCourse.id}
                onChange={(e) => {
                  const nextCourse = tenantCourses.find(
                    (c) => c.id === e.target.value
                  );
                  if (nextCourse) {
                    setSelectedCourseId(nextCourse.id);
                    const first = nextCourse.modules[0]?.lessons[0];
                    if (first) setSelectedLessonId(first.id);
                  }
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-bold text-white focus:outline-none"
              >
                {tenantCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              {/* Círculo de check de curso completado o indicador de avance */}
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                    courseProgressPercent === 100
                      ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                      : 'border-slate-600 bg-slate-950 text-slate-500'
                  }`}
                  title={
                    courseProgressPercent === 100
                      ? '¡Curso 100% Completado!'
                      : `Avance del curso: ${courseProgressPercent}%`
                  }
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </span>
                <span>
                  Tu avance:{' '}
                  <strong
                    className={
                      courseProgressPercent === 100
                        ? 'text-emerald-400'
                        : 'text-white'
                    }
                  >
                    {completedInCourseCount} / {allLessonsOfCourse.length} clases ({courseProgressPercent}%)
                  </strong>
                </span>
                {courseProgressPercent === 100 && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-300 ring-1 ring-emerald-500/40">
                    ✓ Curso Terminado
                  </span>
                )}
              </div>

              <div className="h-2.5 w-36 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${courseProgressPercent}%`,
                    backgroundColor:
                      courseProgressPercent === 100
                        ? '#10B981'
                        : currentTenant.primary_color,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-7 lg:grid-cols-12">
            {/* COLUMNA IZQUIERDA: REPRODUCTOR DE VIDEO REAL + PESTAÑAS (8 COLUMNAS) */}
            <div className="lg:col-span-8">
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
                {/* Contenedor de Video en Alta Definición con Marca de Agua Dinámica */}
                <div className="relative aspect-video w-full bg-black">
                  {/* Marca de agua flotante con los datos del alumno para evitar piratería */}
                  <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-lg bg-black/60 px-3 py-1 font-mono text-[11px] text-white/75 backdrop-blur-sm">
                    {studentEmail} • Licencia Personal ({currentTenant.name})
                  </div>

                  {/* Reproductor: Si la clase tiene un Embed real de Bunny.net / Cloudflare configurado y no se activó el reproductor alternativo */}
                  {!useFallbackHtml5Player &&
                  activeLesson.video_embed_url &&
                  !activeLesson.video_embed_url.includes('/000000/') &&
                  !activeLesson.video_embed_url.includes('customer-demo.') ? (
                    <iframe
                      key={`${activeLesson.id}-${signedBunnyEmbedUrl || 'unsigned'}`}
                      src={signedBunnyEmbedUrl || activeLesson.video_embed_url}
                      title={activeLesson.title}
                      loading="lazy"
                      className="h-full w-full border-0"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      key={activeLesson.id}
                      controls
                      playsInline
                      preload="metadata"
                      poster={activeCourse.thumbnail_url || undefined}
                      onEnded={() => {
                        if (!completedLessonIds.includes(activeLesson.id)) {
                          toggleLessonCompleted(activeLesson.id);
                        }
                      }}
                      className="h-full w-full object-cover"
                      src={
                        REAL_VIDEO_STREAMS[activeLesson.id] || DEFAULT_VIDEO_STREAM
                      }
                    >
                      Tu navegador no soporta reproducción de video HTML5.
                    </video>
                  )}
                </div>

                {/* Barra de Ayuda Rápida para desbloquear el 403 de Seguridad de Bunny.net */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/95 px-5 py-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Video
                      className="h-4 w-4"
                      style={{ color: currentTenant.primary_color }}
                    />
                    <span>
                      Fuente:{' '}
                      <strong>
                        {useFallbackHtml5Player
                          ? 'Reproductor HTML5 Directo'
                          : `Bunny.net Stream (#808934 • ${
                              bunnyTokenKey ? 'Firmado SHA-256' : 'Embed Directo'
                            })`}
                      </strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setShowBunnySecurityHelper(!showBunnySecurityHelper)
                      }
                      className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25"
                    >
                      {showBunnySecurityHelper
                        ? 'Ocultar Ayuda 403 Bunny'
                        : '¿Aparece 403 en el video? Solución aquí'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setUseFallbackHtml5Player(!useFallbackHtml5Player)
                      }
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      {useFallbackHtml5Player
                        ? 'Volver a Reproductor Bunny.net'
                        : 'Probar con Video Demo Integrado'}
                    </button>
                  </div>
                </div>

                {showBunnySecurityHelper && (
                  <div className="border-b border-amber-500/30 bg-amber-500/10 p-5 text-xs text-slate-200">
                    <div className="font-bold text-amber-300">
                      ¿Por qué Bunny.net muestra &ldquo;403&rdquo; y cómo se quita en 10 segundos?
                    </div>
                    <p className="mt-1.5 leading-relaxed text-slate-300">
                      Por defecto, Bunny.net bloquea la reproducción fuera de su propio panel hasta que autorizas el dominio o desactivas el candado de token en tu librería <strong>#808934</strong>. Tienes 2 opciones:
                    </p>
                    <ol className="mt-2 list-inside list-decimal space-y-1.5 text-slate-300">
                      <li>
                        <strong>Opción recomendada (en tu panel de Bunny.net)</strong>: Entra a{' '}
                        <strong>Stream → Tu Librería (#808934) → Security</strong> (en el menú izquierdo):
                        <ul className="ml-5 mt-1 list-disc space-y-1 text-slate-400">
                          <li>
                            Si en <strong>Allowed Referrers</strong> tienes algún dominio escrito, agrega{' '}
                            <code className="text-white">localhost</code> (o déjalo en blanco para permitir los dominios de tus futuros Resellers).
                          </li>
                          <li>
                            Desactiva <strong>Embed view token authentication</strong> (y <strong>CDN token authentication</strong>) y recarga esta página.
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>O si prefieres mantener activo el Token Authentication</strong>: pega aquí abajo la clave{' '}
                        <strong>Embed View Token Authentication Key</strong> (aparece en Bunny → Stream → Security) para que la plataforma firme cada video con SHA-256 automáticamente:
                      </li>
                    </ol>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={bunnyTokenKey}
                        onChange={(e) => {
                          setBunnyTokenKey(e.target.value);
                          localStorage.setItem(
                            'lms_bunny_token_key_808934',
                            e.target.value
                          );
                        }}
                        placeholder="Pega aquí tu Token Authentication Key de la pestaña Security de Bunny..."
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                      {bunnyTokenKey && (
                        <button
                          type="button"
                          onClick={() => {
                            setBunnyTokenKey('');
                            localStorage.removeItem('lms_bunny_token_key_808934');
                          }}
                          className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300"
                        >
                          Limpiar Token
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Barra de Controles de Clase: Anterior / Velocidad / Completar / Siguiente */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!prevLesson}
                      onClick={() => prevLesson && setSelectedLessonId(prevLesson.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={!nextLesson}
                      onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Selector de Velocidad Real */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">Velocidad:</span>
                    {[1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleSpeedChange(rate)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          playbackRate === rate
                            ? 'text-white shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                        style={
                          playbackRate === rate
                            ? { backgroundColor: currentTenant.primary_color }
                            : undefined
                        }
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  {/* Botón Marcar como Completada + Completar y Avanzar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleLessonCompleted(activeLesson.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                        completedLessonIds.includes(activeLesson.id)
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'text-white shadow-md hover:opacity-95'
                      }`}
                      style={
                        !completedLessonIds.includes(activeLesson.id)
                          ? { backgroundColor: currentTenant.primary_color }
                          : undefined
                      }
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          completedLessonIds.includes(activeLesson.id)
                            ? 'border-slate-950 bg-slate-950 text-emerald-400'
                            : 'border-white/80 bg-transparent text-white'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                      {completedLessonIds.includes(activeLesson.id)
                        ? 'Clase Completada ✓'
                        : 'Marcar como Completada'}
                    </button>

                    {nextLesson && !completedLessonIds.includes(activeLesson.id) && (
                      <button
                        type="button"
                        onClick={handleCompleteAndAdvance}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25"
                      >
                        Completar y Siguiente →
                      </button>
                    )}
                  </div>
                </div>

                {/* Título de la Lección y Pestañas Interactivas del Alumno */}
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span
                      className="font-bold uppercase tracking-wider"
                      style={{ color: currentTenant.primary_color }}
                    >
                      Lección {currentLessonIndex + 1} de {allLessonsOfCourse.length}
                    </span>
                    <span>•</span>
                    <span>Duración: {activeLesson.duration_minutes} minutos</span>
                    <span>•</span>
                    <span>CDN: {activeLesson.video_provider.toUpperCase()}</span>
                  </div>

                  <h1 className="mt-1.5 text-2xl font-extrabold text-white">
                    {activeLesson.title}
                  </h1>

                  {/* Barra de Pestañas bajo el video */}
                  <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                    <button
                      type="button"
                      onClick={() => setActiveBottomTab('overview')}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeBottomTab === 'overview'
                          ? 'text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                      style={
                        activeBottomTab === 'overview'
                          ? { backgroundColor: currentTenant.primary_color }
                          : undefined
                      }
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Resumen de la Clase
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveBottomTab('resources')}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeBottomTab === 'resources'
                          ? 'text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                      style={
                        activeBottomTab === 'resources'
                          ? { backgroundColor: currentTenant.primary_color }
                          : undefined
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                      Material Descargable
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveBottomTab('notes')}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeBottomTab === 'notes'
                          ? 'text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                      style={
                        activeBottomTab === 'notes'
                          ? { backgroundColor: currentTenant.primary_color }
                          : undefined
                      }
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Mis Apuntes Personales
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveBottomTab('comments')}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        activeBottomTab === 'comments'
                          ? 'text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                      style={
                        activeBottomTab === 'comments'
                          ? { backgroundColor: currentTenant.primary_color }
                          : undefined
                      }
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Preguntas de la Clase (
                      {(commentsByLesson[activeLesson.id] || []).length})
                    </button>
                  </div>

                  {/* CONTENIDO PESTAÑA 1: RESUMEN */}
                  {activeBottomTab === 'overview' && (
                    <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-300">
                      <p>{activeLesson.description}</p>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-white">
                          Lo que implementarás en esta sesión:
                        </div>
                        <ul className="mt-2.5 space-y-2 text-xs text-slate-300">
                          <li className="flex items-center gap-2">
                            <CheckCircle2
                              className="h-4 w-4 shrink-0"
                              style={{ color: currentTenant.primary_color }}
                            />
                            Paso a paso práctico con ejemplos reales listos para copiar y adaptar.
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2
                              className="h-4 w-4 shrink-0"
                              style={{ color: currentTenant.primary_color }}
                            />
                            Plantilla descargable incluida en la pestaña de Materiales.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO PESTAÑA 2: MATERIAL DESCARGABLE REAL */}
                  {activeBottomTab === 'resources' && (
                    <div className="mt-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                            style={{ backgroundColor: currentTenant.primary_color }}
                          >
                            <Download className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              Plantilla Oficial y Resumen Ejecutivo de la Clase
                            </div>
                            <div className="text-xs text-slate-400">
                              Archivo: {activeLesson.resource_url || '/recursos/plantilla-clase.pdf'} • Incluye tus apuntes
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadResource(
                              activeLesson.title,
                              activeLesson.resource_url || 'plantilla-clase.txt'
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:opacity-95"
                          style={{ backgroundColor: currentTenant.primary_color }}
                        >
                          <Download className="h-4 w-4" />
                          Descargar Material Ahora
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO PESTAÑA 3: BLOC DE APUNTES DEL ALUMNO */}
                  {activeBottomTab === 'notes' && (
                    <div className="mt-5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Tus apuntes privados para &ldquo;{activeLesson.title}&rdquo; (se guardan automáticamente):
                      </label>
                      <textarea
                        rows={5}
                        value={notesByLesson[activeLesson.id] || ''}
                        onChange={(e) =>
                          setNotesByLesson((prev) => ({
                            ...prev,
                            [activeLesson.id]: e.target.value,
                          }))
                        }
                        placeholder="Escribe aquí tus ideas clave, minutos importantes del video o tareas por ejecutar..."
                        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* CONTENIDO PESTAÑA 4: FORO DE PREGUNTAS DE LA CLASE */}
                  {activeBottomTab === 'comments' && (
                    <div className="mt-5 space-y-5">
                      <form onSubmit={handleAddComment} className="flex gap-2.5">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Escribe tu duda o aporte sobre esta clase para el mentor..."
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-extrabold text-white"
                          style={{ backgroundColor: currentTenant.primary_color }}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Publicar
                        </button>
                      </form>

                      <div className="space-y-3">
                        {(commentsByLesson[activeLesson.id] || []).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <strong className="text-white">{item.author}</strong>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                  style={{ backgroundColor: currentTenant.primary_color }}
                                >
                                  {item.roleLabel}
                                </span>
                              </div>
                              <span className="text-slate-500">{item.createdAt}</span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-300">
                              {item.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: TEMARIO DEL CURSO Y CERTIFICADO (4 COLUMNAS) */}
            <div className="space-y-5 lg:col-span-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Temario del Programa
                    </h2>
                    <p className="text-xs text-slate-400">
                      {completedInCourseCount} de {allLessonsOfCourse.length} clases completadas • {activeCourse.modules.length} temas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleAllModules}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
                    >
                      {areAllModulesExpanded ? 'Acortar todos' : 'Desplegar todos'}
                    </button>
                    <GraduationCap
                      className="h-5 w-5 shrink-0"
                      style={{ color: currentTenant.primary_color }}
                    />
                  </div>
                </div>

                {/* Acordeón de Temas con desplazamiento vertical limpio y círculos de check de avance */}
                <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {activeCourse.modules.map((mod, modIndex) => {
                    const isExpanded = expandedModuleIds.includes(mod.id);
                    const hasActiveLesson = mod.lessons.some(
                      (l) => l.id === activeLesson.id
                    );
                    const completedInModule = mod.lessons.filter((l) =>
                      completedLessonIds.includes(l.id)
                    ).length;
                    const isModuleCompleted =
                      mod.lessons.length > 0 &&
                      completedInModule === mod.lessons.length;
                    const moduleProgressPct =
                      mod.lessons.length > 0
                        ? Math.round(
                            (completedInModule / mod.lessons.length) * 100
                          )
                        : 0;
                    const isZero = Boolean(mod.is_subtema_zero);
                    let regularBefore = 0;
                    for (let i = 0; i < modIndex; i++) {
                      if (!activeCourse.modules[i].is_subtema_zero) {
                        regularBefore++;
                      }
                    }
                    const temaDisplayNum = isZero ? 0 : regularBefore + 1;

                    return (
                      <div
                        key={mod.id}
                        className={`overflow-hidden rounded-2xl border transition ${
                          isModuleCompleted
                            ? 'border-emerald-500/40 bg-slate-950/90'
                            : hasActiveLesson
                              ? 'border-slate-700 bg-slate-950/90'
                              : 'border-slate-800/80 bg-slate-950/50'
                        }`}
                      >
                        {/* Cabecera clicable del Acordeón de Tema */}
                        <button
                          type="button"
                          onClick={() => toggleModuleAccordion(mod.id)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-900/80"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            {/* Círculo de Check / Palomita del Tema completo */}
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                isModuleCompleted
                                  ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                                  : completedInModule > 0
                                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                                    : 'border-slate-700 bg-slate-900 text-transparent'
                              }`}
                              title={
                                isModuleCompleted
                                  ? 'Tema 100% completado'
                                  : `${completedInModule} de ${mod.lessons.length} clases completadas`
                              }
                            >
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
                                  style={{
                                    backgroundColor: isModuleCompleted
                                      ? '#10B981'
                                      : hasActiveLesson
                                        ? currentTenant.primary_color
                                        : isZero
                                          ? '#0891B2'
                                          : '#334155',
                                  }}
                                >
                                  {isZero
                                    ? 'Tema 0 • Intro'
                                    : `Tema ${temaDisplayNum}`}
                                </span>
                                <span
                                  className={`text-[11px] font-semibold ${
                                    isModuleCompleted
                                      ? 'text-emerald-400'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {completedInModule}/{mod.lessons.length} clases
                                  {isModuleCompleted ? ' ✓' : ''}
                                </span>
                              </div>
                              <div className="mt-1.5 text-xs font-extrabold leading-snug text-white">
                                {mod.title}
                              </div>

                              {/* Mini barra de avance por Tema */}
                              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${moduleProgressPct}%`,
                                    backgroundColor: isModuleCompleted
                                      ? '#10B981'
                                      : currentTenant.primary_color,
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </button>

                        {/* Lista desplegable de videos del Tema */}
                        {isExpanded && (
                          <div className="space-y-2 border-t border-slate-800/80 bg-slate-950/60 p-3">
                            {mod.lessons.length === 0 ? (
                              <div className="py-2 text-center text-xs text-slate-500">
                                Sin videos en este tema aún.
                              </div>
                            ) : (
                              mod.lessons.map((lesson) => {
                                const isCurrent = lesson.id === activeLesson.id;
                                const isDone = completedLessonIds.includes(
                                  lesson.id
                                );
                                return (
                                  <div
                                    key={lesson.id}
                                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                                      isCurrent
                                        ? 'border-white/30 bg-slate-800 shadow-md'
                                        : isDone
                                          ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-slate-900'
                                          : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-900'
                                    }`}
                                  >
                                    {/* Círculo / Check interactivo para marcar o desmarcar clase completada */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLessonCompleted(lesson.id);
                                      }}
                                      title={
                                        isDone
                                          ? 'Clase completada (clic para desmarcar)'
                                          : 'Marcar clase como completada'
                                      }
                                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                        isDone
                                          ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/40'
                                          : 'border-slate-600 bg-slate-950 text-transparent hover:border-emerald-400'
                                      }`}
                                      style={
                                        !isDone && isCurrent
                                          ? {
                                              borderColor:
                                                currentTenant.primary_color,
                                            }
                                          : undefined
                                      }
                                    >
                                      <Check className="h-3 w-3 stroke-[3]" />
                                    </button>

                                    {/* Área clicable para reproducir la clase */}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedLessonId(lesson.id)}
                                      className="min-w-0 flex-1 text-left"
                                    >
                                      <div
                                        className={`text-xs font-bold ${
                                          isDone
                                            ? 'text-emerald-200'
                                            : 'text-white'
                                        }`}
                                      >
                                        {lesson.title}
                                      </div>
                                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {lesson.duration_minutes} min
                                        </span>
                                        {isDone && (
                                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                            ✓ Completada
                                          </span>
                                        )}
                                        {isCurrent && (
                                          <span
                                            className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                                            style={{
                                              backgroundColor:
                                                currentTenant.primary_color,
                                            }}
                                          >
                                            Reproduciendo
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tarjeta de Certificado Oficial Marca Blanca */}
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                  <Trophy
                    className="mx-auto h-7 w-7"
                    style={{ color: currentTenant.primary_color }}
                  />
                  <div className="mt-2 text-xs font-bold text-white">
                    Certificado Oficial de {currentTenant.name}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {courseProgressPercent === 100
                      ? '¡Felicidades! Has completado el 100% de las clases de este curso.'
                      : `Completa todas las clases (${courseProgressPercent}% actual) o previsualiza tu diploma.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(true)}
                    className="mt-3 w-full rounded-xl py-2.5 text-xs font-extrabold text-white transition hover:opacity-95"
                    style={{ backgroundColor: currentTenant.primary_color }}
                  >
                    Ver Mi Certificado Marca Blanca
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CERTIFICADO OFICIAL CON LA MARCA DE LA ACADEMIA */}
      {showCertificateModal && activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-slate-700 bg-slate-950 p-8 text-center shadow-2xl">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{ backgroundColor: currentTenant.primary_color }}
            >
              <Award className="h-9 w-9" />
            </div>

            <div
              className="mt-4 text-xs font-extrabold uppercase tracking-widest"
              style={{ color: currentTenant.primary_color }}
            >
              Certificado Oficial de Finalización • {currentTenant.name}
            </div>

            <p className="mt-4 text-xs uppercase tracking-widest text-slate-400">
              Se otorga el presente reconocimiento a:
            </p>

            <h2 className="mt-2 text-3xl font-extrabold text-white">
              {studentName}
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-sm text-slate-300">
              Por haber cursado satisfactoriamente el programa de formación especializada:
            </p>

            <div className="mx-auto mt-3 max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="text-lg font-extrabold text-white">
                {activeCourse.title}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Duración acreditada: {activeCourse.duration_label} • Emitido por{' '}
                {currentTenant.custom_domain || `${currentTenant.slug}.plataformalms.com`}
              </div>
            </div>

            <div className="mt-7 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl px-5 py-2.5 text-xs font-extrabold text-white"
                style={{ backgroundColor: currentTenant.primary_color }}
              >
                Imprimir / Guardar en PDF
              </button>
              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
