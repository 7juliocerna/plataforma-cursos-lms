'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLMS } from '@/context/LMSContext';
import { Course } from '@/types/lms';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Flame,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  Lock,
  Menu,
  MessageSquare,
  MonitorX,
  PhoneCall,
  Play,
  PlayCircle,
  Receipt,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Unlock,
  User,
  Video,
  X,
  Zap,
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
    renewSubscription,
    setStudentRemainingDays,
    setIsClassroomFocusMode,
  } = useLMS();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const certificateCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Vista activa del alumno: 'dashboard' (Portal Mi Cuenta estilo Corel MyAccount) o 'classroom' (Reproductor de clase)
  const [studentView, setStudentView] = useState<'dashboard' | 'classroom'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    setIsClassroomFocusMode(studentView === 'classroom');
    return () => setIsClassroomFocusMode(false);
  }, [studentView, setIsClassroomFocusMode]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [activeBottomTab, setActiveBottomTab] = useState<
    'overview' | 'resources' | 'notes' | 'comments'
  >('overview');
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [certificateCourse, setCertificateCourse] = useState<Course | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState<boolean>(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState<boolean>(false);
  const [courseFilter, setCourseFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [selectedRenewalPlan, setSelectedRenewalPlan] = useState<'monthly' | 'quarterly' | 'annual'>('annual');
  const [renewalToast, setRenewalToast] = useState<string | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

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
  const tenantName = currentTenant?.title || currentTenant?.name || 'Academia';
  const studentPlan = currentUser?.is_all_access
    ? 'Membresía All-Access (Pase Total)'
    : currentUser?.subscription_plan || `Acceso a ${tenantName}`;
  const studentEndDateStr = currentUser?.subscription_end_date || '2026-12-05T23:59:59Z';

  // Cálculos dinámicos de suscripción y días restantes estilo SaaS / Corel MyAccount
  const { daysRemaining, isExpired, isExpiringSoon, formattedEndDate } = useMemo(() => {
    const end = new Date(studentEndDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isExp = diffDays < 0;
    const isSoon = diffDays >= 0 && diffDays <= 7;

    const formatted = end.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      daysRemaining: diffDays,
      isExpired: isExp,
      isExpiringSoon: isSoon,
      formattedEndDate: formatted,
    };
  }, [studentEndDateStr]);

  // Historial de pagos y comprobantes
  const paymentHistory = useMemo(() => {
    if (currentUser?.payment_history && currentUser.payment_history.length > 0) {
      return currentUser.payment_history;
    }
    return [
      {
        id: 'REC-2026-8912',
        date: '15 Octubre 2026',
        description: `Membresía Anual — ${currentTenant.name}`,
        amount: '$240.00',
        currency: 'USD',
        status: 'paid' as const,
        invoice_url: '#',
      },
      {
        id: 'REC-2025-4102',
        date: '15 Octubre 2025',
        description: 'Acceso Inicial Campus Virtual',
        amount: '$240.00',
        currency: 'USD',
        status: 'paid' as const,
        invoice_url: '#',
      },
    ];
  }, [currentUser, currentTenant]);

  // Acceso rápido: buscar la última lección vista o siguiente por completar
  const continueLearningTarget = useMemo(() => {
    if (tenantCourses.length === 0) return null;

    // Buscar en los cursos asignados la primera clase que no esté completada
    for (const course of tenantCourses) {
      const courseLessons = course.modules.flatMap((m) => m.lessons);
      const uncompleted = courseLessons.find((l) => !completedLessonIds.includes(l.id));
      if (uncompleted) {
        const mod = course.modules.find((m) => m.id === uncompleted.module_id);
        const doneCount = courseLessons.filter((l) => completedLessonIds.includes(l.id)).length;
        const pct = courseLessons.length > 0 ? Math.round((doneCount / courseLessons.length) * 100) : 0;
        return {
          course,
          module: mod,
          lesson: uncompleted,
          pct,
          doneCount,
          totalLessons: courseLessons.length,
        };
      }
    }

    // Si todo está completado, tomar la primera clase del primer curso
    const firstCourse = tenantCourses[0];
    const firstLesson = firstCourse.modules[0]?.lessons[0];
    const courseLessons = firstCourse.modules.flatMap((m) => m.lessons);
    return {
      course: firstCourse,
      module: firstCourse.modules[0],
      lesson: firstLesson,
      pct: 100,
      doneCount: courseLessons.length,
      totalLessons: courseLessons.length,
    };
  }, [tenantCourses, completedLessonIds]);

  // Filtrado de cursos del catálogo
  const filteredCourses = useMemo(() => {
    return tenantCourses.filter((course) => {
      const courseLessons = course.modules.flatMap((m) => m.lessons);
      const doneCount = courseLessons.filter((l) => completedLessonIds.includes(l.id)).length;
      const isComplete = courseLessons.length > 0 && doneCount === courseLessons.length;

      if (courseFilter === 'completed') return isComplete;
      if (courseFilter === 'in_progress') return !isComplete && doneCount > 0;
      return true;
    });
  }, [tenantCourses, completedLessonIds, courseFilter]);

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
${tenantName.toUpperCase()} — MATERIAL OFICIAL DEL ALUMNO
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pb-20">
      {/* Sub-navegación del Portal del Alumno (Solo visible en Dashboard, se oculta en el Modo Enfoque del Aula) */}
      {studentView === 'dashboard' && (
        <div className="border-b border-[#E2E8F0] bg-white sticky top-0 z-40">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            {/* Identidad de la Academia y Título de Portal */}
            <div className="flex items-center gap-3">
              {currentTenant.logo_url ? (
                <img
                  src={currentTenant.logo_url}
                  alt={tenantName}
                  className="h-8 max-w-[140px] object-contain"
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                  style={{ backgroundColor: currentTenant.primary_color }}
                >
                  {tenantName.charAt(0)}
                </div>
              )}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Portal del Estudiante
                </span>
                <div className="text-sm font-bold text-[#1E293B] line-clamp-1">
                  {tenantName}
                </div>
              </div>
            </div>

            {/* Selector de Vistas: Mi Cuenta / Dashboard vs Aula Virtual */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
              <button
                type="button"
                onClick={() => setStudentView('dashboard')}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  studentView === 'dashboard'
                    ? 'text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
                style={
                  studentView === 'dashboard'
                    ? { backgroundColor: currentTenant.primary_color }
                    : undefined
                }
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Mi Cuenta & Cursos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isExpired) {
                    setShowRenewalModal(true);
                  } else {
                    setStudentView('classroom');
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  isExpired
                    ? 'text-rose-600 hover:text-rose-700'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                {isExpired ? <Lock className="h-3.5 w-3.5" /> : <PlayCircle className="h-4 w-4" />}
                <span>Entrar al Aula (Clases)</span>
                {isExpired && (
                  <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                    Bloqueada
                  </span>
                )}
              </button>
            </div>

            {/* Estado de Membresía e Indicadores Rápidos */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-amber-700">
                <Flame className="h-4 w-4 text-amber-500" />
                <span>Racha: 5 días</span>
              </div>

              {/* Badge de Suscripción en Barra Superior */}
              <div
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold border ${
                  isExpired
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : isExpiringSoon
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isExpired
                      ? 'bg-rose-500'
                      : isExpiringSoon
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-emerald-500'
                  }`}
                />
                <span>
                  {isExpired
                    ? 'Suscripción Vencida'
                    : isExpiringSoon
                      ? `Por Vencer (${daysRemaining}d)`
                      : `Activa (${daysRemaining}d)`}
                </span>
              </div>

              {/* Botón rápido de renovación */}
              <button
                type="button"
                onClick={() => setShowRenewalModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 font-semibold text-[#1E293B] hover:bg-[#F8FAFC] transition shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: currentTenant.primary_color }} />
                <span className="hidden sm:inline">Renovar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast flotante de éxito */}
      {renewalToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/95 px-5 py-3.5 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-md animate-bounce">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{renewalToast}</span>
          <button
            type="button"
            onClick={() => setRenewalToast(null)}
            className="ml-2 text-emerald-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          VISTA 1: PORTAL MI CUENTA / DASHBOARD (ESTILO COREL MYACCOUNT)
      ===================================================================== */}
      {studentView === 'dashboard' && (
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
          {/* Banner crítico en caso de suscripción vencida */}
          {isExpired && (
            <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/50 bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/40 p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/30">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-rose-300">
                      Acceso Restringido
                    </span>
                    <h2 className="mt-1 text-lg font-black text-white">
                      Tu período de suscripción ha expirado
                    </h2>
                    <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Tu plan venció el <strong>{formattedEndDate}</strong>. Para continuar disfrutando
                      del aula virtual, tus cursos inscritos y materiales de {currentTenant.name}, renueva o actualiza tu membresía.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(true)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-xs font-black text-white shadow-xl hover:bg-rose-500 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  Renovar Membresía Ahora
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              1. ENCABEZADO Y ACCESO RÁPIDO ("CONTINUAR APRENDIENDO")
          ================================================================= */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
              {/* Saludo personalizado y marca de la academia */}
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3">
                  {currentTenant.logo_url ? (
                    <img
                      src={currentTenant.logo_url}
                      alt={tenantName}
                      className="h-10 max-w-[160px] object-contain rounded-lg border border-[#E2E8F0] p-1"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white shadow-sm"
                      style={{ backgroundColor: currentTenant.primary_color }}
                    >
                      {tenantName.charAt(0)}
                    </div>
                  )}

                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: currentTenant.primary_color }}
                    >
                      <Sparkles className="h-3 w-3" />
                      Hola de nuevo, {studentName}
                    </span>
                    <h1 className="mt-1 text-2xl font-bold text-[#1E293B] sm:text-3xl font-heading">
                      Bienvenido a tu Portal Académico
                    </h1>
                  </div>
                </div>

                <p className="mt-3 text-xs md:text-sm text-[#64748B] leading-relaxed max-w-xl">
                  {currentTenant.tagline} Gestiona tu membresía, tus certificados oficiales y accede a tus clases en alta definición.
                </p>

                {/* Resumen de actividad del estudiante */}
                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#475569]">
                  <div className="flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 py-1.5 border border-[#E2E8F0]">
                    <BookOpen className="h-4 w-4" style={{ color: currentTenant.primary_color }} />
                    <span><strong>{tenantCourses.length}</strong> Cursos asignados</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 py-1.5 border border-[#E2E8F0]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span><strong>{completedLessonIds.length}</strong> Clases completadas</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta destacada: "Continuar aprendiendo" */}
              <div className="lg:col-span-5">
                {continueLearningTarget ? (
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-sm">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B]">
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <Play className="h-3.5 w-3.5 fill-amber-600 text-amber-600" />
                        Continuar aprendiendo
                      </span>
                      <span className="rounded bg-white px-2 py-0.5 text-[#475569] border border-[#E2E8F0]">
                        {continueLearningTarget.lesson.duration_minutes} min
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider line-clamp-1">
                        {continueLearningTarget.course.title} • {continueLearningTarget.module?.title}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-[#1E293B] line-clamp-1 font-heading">
                        {continueLearningTarget.lesson.title}
                      </h3>
                    </div>

                    {/* Barra de avance en el curso */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-[#64748B]">
                        <span>Progreso del curso:</span>
                        <strong className="text-[#1E293B]">{continueLearningTarget.pct}%</strong>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${continueLearningTarget.pct}%`,
                            backgroundColor: currentTenant.primary_color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Botón principal de 1 clic para ir directo al reproductor */}
                    <div className="mt-4">
                      {isExpired ? (
                        <button
                          type="button"
                          onClick={() => setShowRenewalModal(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-rose-300 py-2.5 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-50 transition"
                        >
                          <Lock className="h-4 w-4 text-rose-600" />
                          Acceso Bloqueado — Renovar Membresía
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(continueLearningTarget.course.id);
                            setSelectedLessonId(continueLearningTarget.lesson.id);
                            setStudentView('classroom');
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition"
                          style={{ backgroundColor: currentTenant.primary_color }}
                        >
                          <PlayCircle className="h-4 w-4" />
                          Continuar viendo clase ahora
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-center text-xs text-[#64748B]">
                    No tienes cursos asignados en este momento.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =================================================================
              2. TARJETA DE ESTADO DE SUSCRIPCIÓN Y MEMBRESÍA (ESTILO COREL MYACCOUNT)
          ================================================================= */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
            {/* Cabecera de la tarjeta con estilo SaaS */}
            <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm"
                  style={{ backgroundColor: currentTenant.primary_color }}
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider font-heading">
                    Estado de tu Suscripción & Membresía
                  </h2>
                  <p className="text-[11px] text-[#64748B]">
                    Portal de Gestión de Cuenta y Licencia • {tenantName}
                  </p>
                </div>
              </div>

              {/* Badge de estado dinámico (Verde / Amarillo / Rojo) */}
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold border shadow-sm ${
                  isExpired
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : isExpiringSoon
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isExpired
                      ? 'bg-rose-500'
                      : isExpiringSoon
                        ? 'bg-amber-500 animate-ping'
                        : 'bg-emerald-500'
                  }`}
                />
                <span>
                  {isExpired
                    ? 'Suscripción Vencida'
                    : isExpiringSoon
                      ? 'Por Vencer (Menos de 7 días)'
                      : 'Membresía Activa'}
                </span>
              </div>
            </div>

            {/* Contenido Principal de Métricas de Suscripción */}
            <div className="p-6 md:p-8">
              <div className="grid gap-6 md:grid-cols-12 md:items-center">
                {/* Métricas: Plan Activo y Fecha de Expiración */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Plan de Acceso Contratado
                    </span>
                    <h3 className="mt-1 text-xl md:text-2xl font-bold text-[#1E293B] font-heading">
                      {studentPlan}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1">
                      Licencia de alumno personal e intransferible. Incluye streaming HD sin anuncios y soporte directo.
                    </p>
                  </div>

                  {/* Contador Grande de Días Restantes */}
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span
                        className={`text-3xl md:text-4xl font-extrabold font-heading ${
                          isExpired
                            ? 'text-rose-600'
                            : isExpiringSoon
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                        }`}
                      >
                        {isExpired ? '0' : daysRemaining}
                      </span>
                      <span className="text-sm font-semibold text-[#1E293B]">
                        {isExpired
                          ? `días de acceso (Venció hace ${Math.abs(daysRemaining)} días)`
                          : `días restantes de acceso`}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-[#64748B]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#64748B]" />
                        Fecha de vencimiento:
                      </span>
                      <strong className="text-[#1E293B]">{formattedEndDate}</strong>
                    </div>

                    {/* Barra visual de período */}
                    <div className="mt-3 h-2 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isExpired
                            ? 'bg-rose-500 w-full'
                            : isExpiringSoon
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                        }`}
                        style={{
                          width: isExpired
                            ? '100%'
                            : `${Math.min(100, Math.max(5, (daysRemaining / 30) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Acciones principales de la tarjeta */}
                <div className="md:col-span-5 flex flex-col gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setShowRenewalModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 px-5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition"
                    style={{ backgroundColor: currentTenant.primary_color }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Renovar o mejorar suscripción
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 px-5 text-xs font-semibold text-[#1E293B] hover:bg-slate-100 transition shadow-sm"
                  >
                    <Receipt className="h-4 w-4 text-[#64748B]" />
                    <span>Historial de Pagos & Comprobantes ({paymentHistory.length})</span>
                    {showPaymentHistory ? (
                      <ChevronUp className="h-4 w-4 ml-auto text-[#64748B]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-auto text-[#64748B]" />
                    )}
                  </button>

                  {/* Simulador rápido de prueba para el evaluador */}
                  <div className="mt-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Probar estados en vivo (Simulador):
                    </span>
                    <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setStudentRemainingDays(currentUser?.id || 'student-impulso-1', 18);
                          setRenewalToast('Estado cambiado: Activa (18 días restantes)');
                        }}
                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                      >
                        🟢 Activa (18d)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentRemainingDays(currentUser?.id || 'student-impulso-1', 4);
                          setRenewalToast('Estado cambiado: Por vencer (4 días restantes)');
                        }}
                        className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-100 transition"
                      >
                        🟡 Por Vencer (4d)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentRemainingDays(currentUser?.id || 'student-impulso-1', -2);
                          setRenewalToast('Estado cambiado: Vencida (-2 días, clases bloqueadas)');
                        }}
                        className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 transition"
                      >
                        🔴 Vencida (-2d)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN DESPLEGABLE: Historial de Pagos y Comprobantes */}
              {showPaymentHistory && (
                <div className="mt-6 border-t border-slate-800/80 pt-6 animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" style={{ color: currentTenant.primary_color }} />
                      Historial de Transacciones y Comprobantes de Pago
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Emitidos a nombre de: {studentName}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 bg-slate-900/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Concepto / Plan</th>
                          <th className="px-4 py-3">Monto</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Nº Recibo</th>
                          <th className="px-4 py-3 text-right">Comprobante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {paymentHistory.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-900/40 transition">
                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                              {rec.date}
                            </td>
                            <td className="px-4 py-3 font-semibold text-white">
                              {rec.description}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-200">
                              {rec.amount} {rec.currency}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/20">
                                <Check className="h-3 w-3" />
                                Pagado
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                              {rec.id}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setActiveReceipt(rec)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 hover:text-white"
                              >
                                <Download className="h-3 w-3" />
                                Ver Recibo
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =================================================================
              3. CATÁLOGO DE "MIS CURSOS INSCRITOS"
          ================================================================= */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#1E293B] flex items-center gap-2 font-heading">
                  <BookOpen className="h-5 w-5" style={{ color: currentTenant.primary_color }} />
                  Mis Cursos Inscritos ({tenantCourses.length})
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  Cursos habilitados para tu usuario según tu plan activo en {tenantName}:
                </p>
              </div>

              {/* Filtros de cursos */}
              <div className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white p-1 text-xs font-semibold shadow-sm">
                <button
                  type="button"
                  onClick={() => setCourseFilter('all')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    courseFilter === 'all'
                      ? 'bg-[#1E293B] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Todos ({tenantCourses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCourseFilter('in_progress')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    courseFilter === 'in_progress'
                      ? 'bg-[#1E293B] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  En Progreso
                </button>
                <button
                  type="button"
                  onClick={() => setCourseFilter('completed')}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    courseFilter === 'completed'
                      ? 'bg-[#1E293B] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Completados
                </button>
              </div>
            </div>

            {/* Grid Bento de tarjetas de cursos */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => {
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
                    className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition hover:border-slate-300 overflow-hidden"
                  >
                    <div>
                      {/* Portada visual limpia estilo Bento */}
                      <div className="relative flex h-40 flex-col justify-between p-5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="rounded-md px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm"
                            style={{ backgroundColor: currentTenant.primary_color }}
                          >
                            {course.category}
                          </span>

                          {isCourseComplete ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                              Completado
                            </span>
                          ) : (
                            <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-[#64748B] border border-[#E2E8F0]">
                              {course.duration_label}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">
                            {course.modules.length} Módulos • {courseLessons.length} Clases
                          </span>
                          <h3 className="mt-1 text-base font-bold text-[#1E293B] line-clamp-2 leading-snug font-heading">
                            {course.title}
                          </h3>
                        </div>
                      </div>

                      {/* Cuerpo de la tarjeta: Descripción y Barra de Progreso */}
                      <div className="p-5">
                        <p className="text-xs leading-relaxed text-[#64748B] line-clamp-2">
                          {course.subtitle || course.description}
                        </p>

                        {/* Barra de progreso visual (0% a 100%) */}
                        <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-[#475569] text-[11px]">
                              <span
                                className={`flex h-4 w-4 items-center justify-center rounded-full border transition ${
                                  isCourseComplete
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-300 bg-white text-transparent'
                                }`}
                              >
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </span>
                              {doneCount} de {courseLessons.length} clases completadas
                            </span>
                            <strong
                              className={`text-xs font-bold ${
                                isCourseComplete ? 'text-emerald-700' : 'text-[#1E293B]'
                              }`}
                            >
                              {pct}%
                            </strong>
                          </div>

                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: isCourseComplete
                                  ? '#059669'
                                  : currentTenant.primary_color,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones del Curso */}
                    <div className="border-t border-[#E2E8F0] p-5 pt-3 space-y-2">
                      {/* Botón principal de un clic: "Ir al curso / Entrar a clases" */}
                      {isExpired ? (
                        <button
                          type="button"
                          onClick={() => setShowRenewalModal(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-rose-300 py-2.5 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-50 transition"
                        >
                          <Lock className="h-4 w-4 text-rose-600" />
                          Acceso Bloqueado — Renovar Plan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            const firstLesson = course.modules[0]?.lessons[0];
                            if (firstLesson) setSelectedLessonId(firstLesson.id);
                            setStudentView('classroom');
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition"
                          style={{
                            backgroundColor: isCourseComplete
                              ? '#059669'
                              : currentTenant.primary_color,
                          }}
                        >
                          {isCourseComplete ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Repasar Clases del Curso
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-4 w-4" />
                              {pct > 0 ? 'Continuar Curso' : 'Entrar a Clases / Ir al Curso'}
                            </>
                          )}
                        </button>
                      )}

                      {/* Botón "Descargar Certificado" habilitado al llegar al 100% */}
                      {isCourseComplete && (
                        <button
                          type="button"
                          onClick={() => {
                            setCertificateCourse(course);
                            setShowCertificateModal(true);
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-sm"
                        >
                          <Award className="h-4 w-4 text-amber-700" />
                          Descargar Certificado Oficial
                        </button>
                      )}
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
        <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
          {/* Banner de aviso si la suscripción está vencida */}
          {isExpired && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border-2 border-rose-500/60 bg-rose-950/40 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    Suscripción Vencida — Acceso al Video Restringido
                  </h4>
                  <p className="text-xs text-rose-200">
                    Tu acceso caducó el {formattedEndDate}. Para desbloquear el reproductor y descargar materiales, renueva tu suscripción.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRenewalModal(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-rose-500 transition"
              >
                <Sparkles className="h-4 w-4" />
                Renovar Ahora
              </button>
            </div>
          )}

          {/* =================================================================
              MODO ENFOQUE (DISTRACTION-FREE CLASSROOM)
              1. Barra superior minimalista con barra de progreso lineal (4px)
          ================================================================= */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
            {/* Barra de progreso lineal delgada (4px de alto) */}
            <div className="h-1 w-full bg-[#E2E8F0]">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${courseProgressPercent}%`,
                  backgroundColor: currentTenant.primary_color,
                }}
              />
            </div>

            {/* Barra superior de lección minimalista */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 bg-white">
              <div className="flex flex-wrap items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setStudentView('dashboard')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#1E293B] hover:bg-slate-100 transition shadow-sm shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Volver al curso</span>
                </button>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] shrink-0">
                    TUACADEMIA | {currentTenant.slug.toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-[#64748B] hidden md:inline truncate max-w-[200px]">
                    {activeCourse.title}
                  </span>
                  <span className="text-[#CBD5E1] hidden md:inline">/</span>
                  <span className="text-xs font-bold text-[#1E293B] truncate max-w-[260px] font-heading">
                    {activeLesson.title}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Avance del curso */}
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <span>
                    Avance: <strong className="text-[#1E293B]">{completedInCourseCount}/{allLessonsOfCourse.length}</strong> ({courseProgressPercent}%)
                  </span>
                </div>

                {/* Botón para colapsar / expandir temario (25%-30% lateral) */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#1E293B] hover:bg-slate-100 transition shadow-sm"
                >
                  <Menu className="h-4 w-4 text-[#64748B]" />
                  <span>{isSidebarCollapsed ? 'Ver Temario' : 'Ocultar Temario'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* =================================================================
              LAYOUT DEL AULA (70%-75% ÁREA CENTRAL / 25%-30% BARRA LATERAL)
          ================================================================= */}
          <div className={`grid gap-6 ${isSidebarCollapsed ? 'grid-cols-1' : 'lg:grid-cols-12'}`}>
            {/* ÁREA CENTRAL: REPRODUCTOR DE VIDEO + LECTURA (70% - 75% DEL ANCHO) */}
            <div className={isSidebarCollapsed ? 'col-span-1' : 'lg:col-span-8 xl:col-span-9'}>
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                {/* Contenedor de Video en Alta Definición con Marca de Agua Dinámica */}
                <div className="relative aspect-video w-full bg-slate-900">
                  {/* Marca de agua flotante con los datos del alumno para evitar piratería */}
                  <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-md bg-black/50 px-2.5 py-1 font-mono text-[11px] text-white/80 backdrop-blur-sm">
                    {studentEmail} • {tenantName}
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
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-2.5 text-xs">
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Video
                      className="h-4 w-4"
                      style={{ color: currentTenant.primary_color }}
                    />
                    <span>
                      Fuente:{' '}
                      <strong className="text-[#1E293B]">
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
                      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition"
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
                      className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1 text-[11px] font-semibold text-[#475569] hover:bg-[#F8FAFC] transition shadow-sm"
                    >
                      {useFallbackHtml5Player
                        ? 'Volver a Reproductor Bunny.net'
                        : 'Probar con Video Demo Integrado'}
                    </button>
                  </div>
                </div>

                {showBunnySecurityHelper && (
                  <div className="border-b border-amber-200 bg-amber-50/70 p-5 text-xs text-amber-950">
                    <div className="font-bold text-amber-900">
                      ¿Por qué Bunny.net muestra &ldquo;403&rdquo; y cómo se quita en 10 segundos?
                    </div>
                    <p className="mt-1.5 leading-relaxed text-amber-900">
                      Por defecto, Bunny.net bloquea la reproducción fuera de su propio panel hasta que autorizas el dominio o desactivas el candado de token en tu librería <strong>#808934</strong>. Tienes 2 opciones:
                    </p>
                    <ol className="mt-2 list-inside list-decimal space-y-1.5 text-amber-900">
                      <li>
                        <strong>Opción recomendada (en tu panel de Bunny.net)</strong>: Entra a{' '}
                        <strong>Stream → Tu Librería (#808934) → Security</strong> (en el menú izquierdo):
                        <ul className="ml-5 mt-1 list-disc space-y-1 text-amber-800">
                          <li>
                            Si en <strong>Allowed Referrers</strong> tienes algún dominio escrito, agrega{' '}
                            <code className="text-black font-semibold">localhost</code> (o déjalo en blanco para permitir todos los dominios).
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
                        className="flex-1 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs text-[#1E293B] focus:outline-none"
                      />
                      {bunnyTokenKey && (
                        <button
                          type="button"
                          onClick={() => {
                            setBunnyTokenKey('');
                            localStorage.removeItem('lms_bunny_token_key_808934');
                          }}
                          className="rounded-xl bg-amber-200 px-3 py-2 text-xs font-semibold text-amber-900"
                        >
                          Limpiar Token
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Barra de Controles de Clase: Anterior / Velocidad / Completar / Siguiente */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!prevLesson}
                      onClick={() => prevLesson && setSelectedLessonId(prevLesson.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E293B] transition hover:bg-[#F8FAFC] disabled:opacity-40 shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={!nextLesson}
                      onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E293B] transition hover:bg-[#F8FAFC] disabled:opacity-40 shadow-sm"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Selector de Velocidad Real */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[#64748B]">Velocidad:</span>
                    {[1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleSpeedChange(rate)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          playbackRate === rate
                            ? 'text-white shadow-sm'
                            : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
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
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                        completedLessonIds.includes(activeLesson.id)
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'text-white shadow-sm hover:opacity-90'
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
                            ? 'border-emerald-700 bg-emerald-600 text-white'
                            : 'border-white bg-transparent text-white'
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
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                      >
                        Completar y Siguiente →
                      </button>
                    )}
                  </div>
                </div>

                {/* Título de la Lección y Pestañas Interactivas del Alumno */}
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
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

                  <h1 className="mt-1.5 text-2xl font-bold text-[#1E293B] font-heading">
                    {activeLesson.title}
                  </h1>

                  {/* Barra de Pestañas bajo el video */}
                  <div className="mt-6 flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-3">
                    <button
                      type="button"
                      onClick={() => setActiveBottomTab('overview')}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        activeBottomTab === 'overview'
                          ? 'text-white shadow-sm'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
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
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        activeBottomTab === 'resources'
                          ? 'text-white shadow-sm'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
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
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        activeBottomTab === 'notes'
                          ? 'text-white shadow-sm'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
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
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                        activeBottomTab === 'comments'
                          ? 'text-white shadow-sm'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
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

                  {/* CONTENIDO PESTAÑA 1: RESUMEN (ERGONOMÍA DE LECTURA 65-75ch) */}
                  {activeBottomTab === 'overview' && (
                    <div className="mt-5 space-y-4">
                      {/* Bloque de lectura con ancho ergonómico calibrado (measure 65ch - 75ch, 1.68 line-height) */}
                      <div className="measure-reading text-[#1E293B]">
                        <p>{activeLesson.description}</p>
                      </div>

                      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 max-w-[72ch]">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#1E293B] font-heading">
                          Lo que implementarás en esta sesión:
                        </div>
                        <ul className="mt-2.5 space-y-2 text-xs text-[#475569]">
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
                      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm"
                            style={{ backgroundColor: currentTenant.primary_color }}
                          >
                            <Download className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#1E293B] font-heading">
                              Plantilla Oficial y Resumen Ejecutivo de la Clase
                            </div>
                            <div className="text-xs text-[#64748B]">
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
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
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
                    <div className="mt-5 max-w-[72ch]">
                      <label className="block text-xs font-semibold text-[#475569]">
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
                        className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-white p-4 text-sm text-[#1E293B] focus:border-slate-400 focus:outline-none shadow-sm font-sans"
                      />
                    </div>
                  )}

                  {/* CONTENIDO PESTAÑA 4: FORO DE PREGUNTAS DE LA CLASE */}
                  {activeBottomTab === 'comments' && (
                    <div className="mt-5 space-y-4 max-w-[72ch]">
                      <form onSubmit={handleAddComment} className="flex gap-2.5">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Escribe tu duda o aporte sobre esta clase para el mentor..."
                          className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#1E293B] focus:outline-none shadow-sm"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90"
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
                            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <strong className="text-[#1E293B]">{item.author}</strong>
                                <span
                                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                  style={{ backgroundColor: currentTenant.primary_color }}
                                >
                                  {item.roleLabel}
                                </span>
                              </div>
                              <span className="text-[#64748B]">{item.createdAt}</span>
                            </div>
                            <p className="mt-2 text-[#475569] leading-relaxed">
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

            {/* COLUMNA DERECHA: TEMARIO DEL CURSO Y CERTIFICADO (25% - 30% DEL ANCHO) */}
            {!isSidebarCollapsed && (
              <div className="space-y-5 lg:col-span-4 xl:col-span-3">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                    <div>
                      <h2 className="text-base font-bold text-[#1E293B]">
                        Temario del Programa
                      </h2>
                      <p className="text-xs text-[#64748B]">
                        {completedInCourseCount} de {allLessonsOfCourse.length} clases completadas • {activeCourse.modules.length} temas
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleAllModules}
                        className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-bold text-[#475569] transition hover:bg-slate-100 hover:text-[#1E293B]"
                      >
                        {areAllModulesExpanded ? 'Acortar' : 'Desplegar'}
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
                          className={`overflow-hidden rounded-xl border transition ${
                            isModuleCompleted
                              ? 'border-emerald-200 bg-emerald-50/40'
                              : hasActiveLesson
                                ? 'border-[#CBD5E1] bg-[#F8FAFC]'
                                : 'border-[#E2E8F0] bg-white'
                          }`}
                        >
                          {/* Cabecera clicable del Acordeón de Tema */}
                          <button
                            type="button"
                            onClick={() => toggleModuleAccordion(mod.id)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              {/* Círculo de Check / Palomita del Tema completo */}
                              <span
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                  isModuleCompleted
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : completedInModule > 0
                                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                      : 'border-slate-300 bg-white text-transparent'
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
                                    className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                                    style={{
                                      backgroundColor: isModuleCompleted
                                        ? '#059669'
                                        : hasActiveLesson
                                          ? currentTenant.primary_color
                                          : isZero
                                            ? '#0284C7'
                                            : '#64748B',
                                    }}
                                  >
                                    {isZero
                                      ? 'Tema 0 • Intro'
                                      : `Tema ${temaDisplayNum}`}
                                  </span>
                                  <span
                                    className={`text-[11px] font-semibold ${
                                      isModuleCompleted
                                        ? 'text-emerald-700'
                                        : 'text-[#64748B]'
                                    }`}
                                  >
                                    {completedInModule}/{mod.lessons.length} clases
                                    {isModuleCompleted ? ' ✓' : ''}
                                  </span>
                                </div>
                                <div className="mt-1.5 text-xs font-bold leading-snug text-[#1E293B]">
                                  {mod.title}
                                </div>

                                {/* Mini barra de avance por Tema */}
                                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${moduleProgressPct}%`,
                                      backgroundColor: isModuleCompleted
                                        ? '#059669'
                                        : currentTenant.primary_color,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]">
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </div>
                          </button>

                          {/* Lista desplegable de videos del Tema */}
                          {isExpanded && (
                            <div className="space-y-1.5 border-t border-[#E2E8F0] bg-[#FAF9F6]/50 p-2.5">
                              {mod.lessons.length === 0 ? (
                                <div className="py-2 text-center text-xs text-[#94A3B8]">
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
                                      className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                                        isCurrent
                                          ? 'border-slate-300 bg-white shadow-sm ring-1 ring-slate-200'
                                          : isDone
                                            ? 'border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/60'
                                            : 'border-transparent bg-white hover:border-[#E2E8F0]'
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
                                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                                          isDone
                                            ? 'border-emerald-600 bg-emerald-600 text-white'
                                            : 'border-slate-300 bg-white text-transparent hover:border-emerald-500'
                                        }`}
                                      >
                                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                                      </button>

                                      {/* Área clicable para reproducir la clase */}
                                      <button
                                        type="button"
                                        onClick={() => setSelectedLessonId(lesson.id)}
                                        className="min-w-0 flex-1 text-left"
                                      >
                                        <div
                                          className={`text-xs font-semibold ${
                                            isDone
                                              ? 'text-emerald-900'
                                              : isCurrent
                                                ? 'text-[#1E293B] font-bold'
                                                : 'text-[#334155]'
                                          }`}
                                        >
                                          {lesson.title}
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#64748B]">
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {lesson.duration_minutes} min
                                          </span>
                                          {isDone && (
                                            <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                                              ✓ Hecha
                                            </span>
                                          )}
                                          {isCurrent && (
                                            <span
                                              className="rounded px-1.5 py-0.2 text-[10px] font-bold text-white"
                                              style={{
                                                backgroundColor:
                                                  currentTenant.primary_color,
                                              }}
                                            >
                                              En pantalla
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
                  <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
                    <Trophy
                      className="mx-auto h-6 w-6"
                      style={{ color: currentTenant.primary_color }}
                    />
                    <div className="mt-2 text-xs font-bold text-[#1E293B]">
                      Certificado de Finalización
                    </div>
                    <p className="mt-1 text-[11px] text-[#64748B]">
                      {courseProgressPercent === 100
                        ? '¡Has completado el 100% de las clases de este curso!'
                        : `${courseProgressPercent}% completado. Llega al 100% para obtener tu diploma.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCertificateModal(true)}
                      className="mt-3 w-full rounded-xl py-2 text-xs font-bold text-white transition hover:opacity-95 shadow-sm"
                      style={{ backgroundColor: currentTenant.primary_color }}
                    >
                      Ver Certificado
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: CERTIFICADO OFICIAL DE FINALIZACIÓN MARCA BLANCA
      ===================================================================== */}
      {showCertificateModal && (certificateCourse || activeCourse) && (
        (() => {
          const certCourse = certificateCourse || activeCourse!;
          const certLessons = certCourse.modules.flatMap((m) => m.lessons);
          const certDoneCount = certLessons.filter((l) => completedLessonIds.includes(l.id)).length;
          const certPct = certLessons.length > 0 ? Math.round((certDoneCount / certLessons.length) * 100) : 0;
          const certId = `CERT-${certCourse.id.slice(0, 6).toUpperCase()}-${(currentUser?.id || 'std').slice(-4).toUpperCase()}`;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm overflow-y-auto">
              <div className="relative w-full max-w-3xl my-8 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 text-center shadow-2xl">
                {/* Botón cerrar modal */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCertificateModal(false);
                    setCertificateCourse(null);
                  }}
                  className="absolute right-5 top-5 rounded-full p-2 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Contenedor del Certificado Imprimible */}
                <div
                  id="official-certificate-container"
                  className="relative rounded-xl border-2 border-[#E2E8F0] bg-[#FAF9F6] p-8 sm:p-12 shadow-sm"
                >
                  {/* Sello / Escudo de la Academia */}
                  <div className="flex justify-center items-center gap-3">
                    {currentTenant.logo_url ? (
                      <img
                        src={currentTenant.logo_url}
                        alt={currentTenant.name}
                        className="h-12 max-w-[180px] object-contain"
                      />
                    ) : (
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md ring-4 ring-amber-100"
                        style={{ backgroundColor: currentTenant.primary_color }}
                      >
                        <Award className="h-8 w-8 text-amber-100" />
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-700">
                      Certificación Oficial de Excelencia Académica
                    </span>
                    <h3 className="text-sm font-extrabold text-[#1E293B] uppercase tracking-widest mt-1">
                      {currentTenant.name}
                    </h3>
                  </div>

                  <div className="my-5 h-px w-24 mx-auto bg-[#E2E8F0]" />

                  <p className="text-xs uppercase tracking-widest text-[#64748B] font-semibold">
                    El comité académico y directivo otorga la presente distinción a:
                  </p>

                  <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight">
                    {studentName}
                  </h2>
                  <p className="text-xs text-[#64748B] font-mono mt-1">
                    {studentEmail}
                  </p>

                  <p className="mx-auto mt-5 max-w-lg text-xs sm:text-sm text-[#475569] leading-relaxed">
                    Por haber cursado, aprobado y completado el <strong>100%</strong> de los contenidos, lecciones prácticas y evaluaciones del programa:
                  </p>

                  <div className="mx-auto mt-4 max-w-xl rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
                    <div className="text-lg sm:text-xl font-bold text-[#1E293B]">
                      {certCourse.title}
                    </div>
                    <div className="mt-2 flex flex-wrap justify-center items-center gap-4 text-xs text-[#64748B]">
                      <span>Módulos: <strong className="text-[#1E293B]">{certCourse.modules.length}</strong></span>
                      <span>•</span>
                      <span>Clases: <strong className="text-[#1E293B]">{certLessons.length}</strong></span>
                      <span>•</span>
                      <span>Carga Horaria: <strong className="text-[#1E293B]">{certCourse.duration_label}</strong></span>
                    </div>
                  </div>

                  {/* Metadatos y firma de validación */}
                  <div className="mt-8 pt-6 border-t border-[#E2E8F0] grid grid-cols-2 gap-4 text-left text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                        Fecha de Emisión:
                      </span>
                      <strong className="text-[#1E293B]">
                        {new Date().toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>
                      <span className="text-[10px] text-[#64748B] block mt-1 font-mono">
                        Código: {certId}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                        Acreditado por:
                      </span>
                      <strong className="text-[#1E293B] block">
                        Dirección Académica {currentTenant.name}
                      </strong>
                      <span className="text-[10px] text-emerald-700 font-semibold inline-flex items-center gap-1 justify-end mt-1">
                        <CheckCircle2 className="h-3 w-3" /> Verificación Criptográfica Válida
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones del Modal */}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
                    style={{ backgroundColor: currentTenant.primary_color }}
                  >
                    <Download className="h-4 w-4" />
                    Imprimir / Guardar en PDF Oficial
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const content = `================================================================================
DIPLOMA Y CERTIFICADO OFICIAL DE CULMINACIÓN SATISFACTORIA
${tenantName.toUpperCase()} — CAMPUS VIRTUAL
================================================================================

Se certifica que:
NOMBRE DEL ALUMNO: ${studentName.toUpperCase()}
IDENTIFICACIÓN / EMAIL: ${studentEmail}

Ha completado satisfactoriamente el 100% de los requisitos del programa:
PROGRAMA: "${certCourse.title.toUpperCase()}"
DURACIÓN ESTIMADA: ${certCourse.duration_label}
CANTIDAD DE MÓDULOS: ${certCourse.modules.length} Módulos
TOTAL DE CLASES ACREDITADAS: ${certLessons.length} Lecciones

FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
CÓDIGO ÚNICO DE VERIFICACIÓN: ${certId}
ENTIDAD EMISORA: ${tenantName} (${currentTenant?.slug ? `${currentTenant.slug}.plataformalms.com` : 'plataformalms.com'})

================================================================================
Este certificado digital valida el dominio de las competencias y herramientas
impartidas durante el curso. Para verificar su autenticidad, contactar a ${currentTenant.support_email}.
================================================================================`;

                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Certificado-${certCourse.slug || 'curso'}-${studentName.replace(/\s+/g, '_')}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-xs font-semibold text-[#1E293B] hover:bg-[#F8FAFC] transition shadow-xs"
                  >
                    <FileText className="h-4 w-4" />
                    Descargar Acta Digital (.txt)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCertificateModal(false);
                      setCertificateCourse(null);
                    }}
                    className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* =====================================================================
          MODAL 2: RENOVAR O MEJORAR SUSCRIPCIÓN (ESTILO SAAS / COREL MYACCOUNT)
      ===================================================================== */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl my-8 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 text-left shadow-2xl">
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => setShowRenewalModal(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Encabezado del modal */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ backgroundColor: currentTenant.primary_color }}
              >
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Renovación & Ampliación de Membresía
                </span>
                <h3 className="text-xl font-bold text-[#1E293B]">
                  {currentTenant.name}
                </h3>
              </div>
            </div>

            <p className="mt-3 text-xs text-[#475569] leading-relaxed">
              Selecciona el período de extensión para tu cuenta <strong>{studentEmail}</strong>. Tendrás acceso inmediato y sin interrupciones a todos los cursos pregrabados, actualizaciones y certificados.
            </p>

            {/* Opciones de planes */}
            <div className="mt-5 space-y-3">
              {/* Opción 1: Mensual */}
              <label
                onClick={() => setSelectedRenewalPlan('monthly')}
                className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition ${
                  selectedRenewalPlan === 'monthly'
                    ? 'border-slate-800 bg-white ring-2 ring-slate-800 shadow-sm'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="renewalPlan"
                    checked={selectedRenewalPlan === 'monthly'}
                    onChange={() => setSelectedRenewalPlan('monthly')}
                    className="accent-slate-800 h-4 w-4"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#1E293B]">
                      Membresía Mensual (+30 días de acceso)
                    </h4>
                    <p className="text-[11px] text-[#64748B]">
                      Flexibilidad mes a mes con acceso ilimitado.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#1E293B]">$29.00 USD</div>
                  <span className="text-[10px] text-[#64748B]">por mes</span>
                </div>
              </label>

              {/* Opción 2: Trimestral */}
              <label
                onClick={() => setSelectedRenewalPlan('quarterly')}
                className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition ${
                  selectedRenewalPlan === 'quarterly'
                    ? 'border-slate-800 bg-white ring-2 ring-slate-800 shadow-sm'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="renewalPlan"
                    checked={selectedRenewalPlan === 'quarterly'}
                    onChange={() => setSelectedRenewalPlan('quarterly')}
                    className="accent-slate-800 h-4 w-4"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#1E293B]">
                        Pack Trimestral (+90 días de acceso)
                      </h4>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                        Popular
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Equivalente a $29.66/mes.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#1E293B]">$89.00 USD</div>
                  <span className="text-[10px] text-[#64748B]">cada 3 meses</span>
                </div>
              </label>

              {/* Opción 3: Anual (Mejor valor) */}
              <label
                onClick={() => setSelectedRenewalPlan('annual')}
                className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition ${
                  selectedRenewalPlan === 'annual'
                    ? 'border-emerald-600 bg-white ring-2 ring-emerald-600 shadow-sm'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="renewalPlan"
                    checked={selectedRenewalPlan === 'annual'}
                    onChange={() => setSelectedRenewalPlan('annual')}
                    className="accent-emerald-600 h-4 w-4"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#1E293B]">
                        Membresía Total Anual (+365 días)
                      </h4>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                        Ahorra 35%
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Todo un año garantizado con acceso a nuevos cursos.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-700">$240.00 USD</div>
                  <span className="text-[10px] text-[#64748B]">($20/mes)</span>
                </div>
              </label>
            </div>

            {/* Canales de Pago y Soporte de la Academia */}
            <div className="mt-6 space-y-3">
              {/* Botón de Renovación Inmediata Simulada / Live */}
              <button
                type="button"
                onClick={() => {
                  const days = selectedRenewalPlan === 'annual' ? 365 : selectedRenewalPlan === 'quarterly' ? 90 : 30;
                  const planName = selectedRenewalPlan === 'annual'
                    ? 'Membresía Total Anual (Acceso Completo)'
                    : selectedRenewalPlan === 'quarterly'
                      ? 'Pack Trimestral Especializado'
                      : 'Membresía Mensual Regular';

                  const result = renewSubscription(currentUser?.id || 'student-impulso-1', planName, days);
                  setShowRenewalModal(false);
                  setRenewalToast(result.message);
                }}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3 px-5 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
                style={{ backgroundColor: currentTenant.primary_color }}
              >
                <CreditCard className="h-4 w-4" />
                Confirmar Renovación Inmediata con Tarjeta / Stripe
              </button>

              {/* Botón de Contacto Directo WhatsApp con la Academia */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hola equipo de ${currentTenant.name}, deseo renovar o mejorar mi membresía de alumno para el correo: ${studentEmail}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 px-5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
              >
                <PhoneCall className="h-4 w-4 text-emerald-700" />
                Contactar a Asesor por WhatsApp
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>

            <div className="mt-4 text-center">
              <span className="text-[11px] text-[#64748B]">
                ¿Dudas con tu facturación? Escríbenos a{' '}
                <a
                  href={`mailto:${currentTenant.support_email}`}
                  className="text-[#1E293B] underline font-semibold hover:text-black"
                >
                  {currentTenant.support_email}
                </a>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: COMPROBANTE / RECIBO DE PAGO DIGITAL
      ===================================================================== */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 text-left shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveReceipt(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ backgroundColor: currentTenant.primary_color }}
              >
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Comprobante Electrónico
                </span>
                <h3 className="text-base font-bold text-[#1E293B]">
                  Recibo #{activeReceipt.id}
                </h3>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs">
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">Emisor:</span>
                <strong className="text-[#1E293B]">{currentTenant.name}</strong>
              </div>
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">Cliente / Alumno:</span>
                <strong className="text-[#1E293B]">{studentName}</strong>
              </div>
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">Correo:</span>
                <span className="text-[#334155] font-mono">{studentEmail}</span>
              </div>
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">Fecha de Pago:</span>
                <span className="text-[#334155]">{activeReceipt.date}</span>
              </div>
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">Concepto:</span>
                <strong className="text-[#1E293B]">{activeReceipt.description}</strong>
              </div>
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="text-[#64748B]">Estado:</span>
                <span className="font-bold text-emerald-700">Pagado y Conciliado ✓</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold">
                <span className="text-[#1E293B]">Total Abonado:</span>
                <span className="text-emerald-700">{activeReceipt.amount} {activeReceipt.currency}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-95 shadow-sm"
                style={{ backgroundColor: currentTenant.primary_color }}
              >
                Imprimir Recibo
              </button>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
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
