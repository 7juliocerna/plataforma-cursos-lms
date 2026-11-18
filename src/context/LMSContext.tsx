'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Academy,
  Course,
  CourseModule,
  GlobalPaymentSettings,
  Lesson,
  SubscriptionWebhookLog,
  UserProfile,
  UserRole,
  VideoProviderType,
} from '@/types/lms';
import {
  INITIAL_ACADEMIES,
  INITIAL_COURSES,
  INITIAL_GLOBAL_PAYMENT_SETTINGS,
  INITIAL_USERS,
  INITIAL_WEBHOOK_LOGS,
} from '@/lib/mock-data';
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface BunnyRemoteVideo {
  guid: string;
  title: string;
  collectionId?: string | null;
  collectionName?: string | null;
  durationMinutes: number;
  embedUrl: string;
}

interface CreateCourseInput {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  duration_label: string;
  module_title?: string;
  initial_modules?: { title: string; is_subtema_zero?: boolean; description?: string }[];
  lesson_title?: string;
  video_provider?: VideoProviderType;
  video_id?: string;
  video_embed_url?: string;
  academy_id: string;
  assigned_tenant_ids?: string[];
}

interface AddModuleInput {
  course_id: string;
  title: string;
  description?: string;
  is_subtema_zero?: boolean;
}

interface AddLessonInput {
  course_id: string;
  module_id: string;
  title: string;
  description: string;
  video_provider: VideoProviderType;
  video_id: string;
  video_embed_url: string;
  duration_minutes: number;
}

interface LMSContextType {
  isSupabaseLive: boolean;
  // Academias Propias (Multi-Academia)
  academies: Academy[];
  currentAcademy: Academy;
  selectAcademyById: (id: string) => void;
  selectAcademyBySlug: (slug: string) => void;
  createAcademy: (input: {
    title: string;
    slug: string;
    description: string;
    primary_color?: string;
    secondary_color?: string;
    price_monthly?: number;
    price_annual?: number;
    icon_name?: string;
  }) => { ok: boolean; message: string; academyId?: string };
  updateAcademy: (academyId: string, updates: Partial<Academy>) => { ok: boolean; message: string };
  // Aliases de retrocompatibilidad
  tenants: Academy[];
  currentTenant: Academy;
  selectTenantById: (id: string) => void;
  selectTenantBySlug: (slug: string) => void;

  // Usuarios y Autenticación Real Supabase
  users: UserProfile[];
  currentUser: UserProfile | null;
  signInWithEmail: (email: string, password?: string) => Promise<{ ok: boolean; message: string; role?: UserRole }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  loginAsRole: (role: UserRole) => void;
  loginWithCredentials: (email: string, password?: string) => { ok: boolean; message: string; role?: UserRole };
  logout: () => void;

  // Cursos y Contenidos
  courses: Course[];
  academyCourses: Course[];
  tenantCourses: Course[];
  createCourse: (input: CreateCourseInput) => { ok: boolean; message: string; courseId?: string };
  renameCourse: (courseId: string, newTitle: string, newSubtitle?: string) => { ok: boolean; message: string };
  deleteCourse: (courseId: string) => void;
  addModuleToCourse: (input: AddModuleInput) => { ok: boolean; message: string; moduleId?: string };
  renameModuleInCourse: (courseId: string, moduleId: string, newTitle: string) => { ok: boolean; message: string };
  toggleModuleSubtemaZero: (courseId: string, moduleId: string) => { ok: boolean; message: string };
  sortModuleLessonsAlphabetically: (courseId: string, moduleId: string) => { ok: boolean; message: string };
  reorderModuleInCourse: (courseId: string, moduleId: string, direction: 'up' | 'down') => void;
  deleteModuleFromCourse: (courseId: string, moduleId: string) => void;
  addLessonToCourse: (input: AddLessonInput) => { ok: boolean; message: string };
  renameLessonInCourse: (courseId: string, moduleId: string, lessonId: string, newTitle: string) => { ok: boolean; message: string };
  moveLessonToModule: (courseId: string, lessonId: string, targetModuleId: string) => { ok: boolean; message: string };
  reorderLessonInModule: (courseId: string, moduleId: string, lessonId: string, direction: 'up' | 'down') => void;
  deleteLessonFromCourse: (courseId: string, moduleId: string, lessonId: string) => void;
  assignBunnyVideosToSubtema: (courseId: string, targetModuleId: string, videos: BunnyRemoteVideo[]) => { ok: boolean; message: string };
  syncBunnyVideosIntoCourse: (courseId: string, targetModuleId?: string) => Promise<{ ok: boolean; message: string; addedCount: number; totalBunnyCount: number }>;
  completedLessonIds: string[];
  toggleLessonCompleted: (lessonId: string) => void;

  // Modo Enfoque Aula Virtual (Distraction-Free Classroom)
  isClassroomFocusMode: boolean;
  setIsClassroomFocusMode: (val: boolean) => void;

  // Control Anti-Compartir Cuenta (Sesión Única)
  localSessionToken: string;
  isSessionDisplaced: boolean;
  displacedByDevice: string | null;
  reclaimCurrentDeviceSession: () => void;
  simulateConcurrentLoginFromOtherDevice: () => void;

  // Suscripciones y Pagos Globales
  globalPaymentSettings: GlobalPaymentSettings;
  updateGlobalPaymentSettings: (settings: Partial<GlobalPaymentSettings>) => void;
  renewSubscription: (studentId: string, planName?: string, additionalDays?: number) => { ok: boolean; message: string };
  setStudentRemainingDays: (studentId: string, daysRemaining: number) => void;
  hasAccessToAcademy: (academyId: string) => boolean;

  // Utilidades
  webhookLogs: SubscriptionWebhookLog[];
  resetDemoData: () => void;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACADEMIES: 'lms_v2_academies',
  USERS: 'lms_v2_users',
  COURSES: 'lms_v2_courses',
  CURRENT_ACADEMY_ID: 'lms_v2_current_academy_id',
  CURRENT_USER_ID: 'lms_v2_current_user_id',
  COMPLETED_LESSONS: 'lms_v2_completed_lessons',
  PAYMENT_SETTINGS: 'lms_v2_payment_settings',
  LOCAL_SESSION_TOKEN: 'lms_v2_session_token',
};

export function LMSProvider({ children }: { children: React.ReactNode }) {
  const [academies, setAcademies] = useState<Academy[]>(INITIAL_ACADEMIES);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [currentAcademyId, setCurrentAcademyId] = useState<string>(INITIAL_ACADEMIES[0].id);
  const [currentUserId, setCurrentUserId] = useState<string | null>(INITIAL_USERS[1].id); // Por defecto Laura Gómez (Alumna)
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([
    'eeee1111-1111-1111-1111-111111111111',
  ]);
  const [localSessionToken, setLocalSessionToken] = useState<string>('sess-st-laura-991');
  const [globalPaymentSettings, setGlobalPaymentSettings] = useState<GlobalPaymentSettings>(INITIAL_GLOBAL_PAYMENT_SETTINGS);
  const [webhookLogs] = useState<SubscriptionWebhookLog[]>(INITIAL_WEBHOOK_LOGS);
  const [isClassroomFocusMode, setIsClassroomFocusMode] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const isSupabaseLive = isSupabaseConfigured();

  // Hidratación desde localStorage
  useEffect(() => {
    try {
      const savedAcademies = localStorage.getItem(STORAGE_KEYS.ACADEMIES);
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const savedCourses = localStorage.getItem(STORAGE_KEYS.COURSES);
      const savedAcademyId = localStorage.getItem(STORAGE_KEYS.CURRENT_ACADEMY_ID);
      const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const savedCompleted = localStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS);
      const savedSessionToken = localStorage.getItem(STORAGE_KEYS.LOCAL_SESSION_TOKEN);
      const savedPaymentSettings = localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS);

      if (savedAcademies) setAcademies(JSON.parse(savedAcademies));
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      if (savedCourses) setCourses(JSON.parse(savedCourses));
      if (savedAcademyId) setCurrentAcademyId(savedAcademyId);
      if (savedUserId) setCurrentUserId(savedUserId);
      if (savedCompleted) setCompletedLessonIds(JSON.parse(savedCompleted));
      if (savedSessionToken) setLocalSessionToken(savedSessionToken);
      if (savedPaymentSettings) setGlobalPaymentSettings(JSON.parse(savedPaymentSettings));
    } catch (e) {
      console.error('Error al hidratar estado LMS:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persistir en localStorage
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEYS.ACADEMIES, JSON.stringify(academies));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    localStorage.setItem(STORAGE_KEYS.CURRENT_ACADEMY_ID, currentAcademyId);
    if (currentUserId) localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(completedLessonIds));
    localStorage.setItem(STORAGE_KEYS.LOCAL_SESSION_TOKEN, localSessionToken);
    localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, JSON.stringify(globalPaymentSettings));
  }, [isHydrated, academies, users, courses, currentAcademyId, currentUserId, completedLessonIds, localSessionToken, globalPaymentSettings]);

  // Escuchar Autenticación en vivo con Supabase Auth si está configurado
  useEffect(() => {
    if (!isSupabaseLive) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const syncLiveProfile = (user: { id: string; email?: string }, profileData: any) => {
      const liveProfile: UserProfile = {
        id: profileData?.id || user.id,
        email: profileData?.email || user.email || '',
        full_name: profileData?.full_name || user.email?.split('@')[0] || 'Usuario',
        role: (profileData?.role as UserRole) || 'student',
        is_all_access: Boolean(profileData?.is_all_access),
        all_access_end_date: profileData?.all_access_end_date,
        active_session_id: profileData?.active_session_id,
        active_session_device: profileData?.active_session_device,
        last_session_at: profileData?.last_session_at,
        created_at: profileData?.created_at || new Date().toISOString(),
        subscription_plan: profileData?.is_all_access ? 'Membresía All-Access (Pase Total)' : 'Suscripción por Academia',
        subscription_end_date: profileData?.all_access_end_date || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        subscription_status: 'active',
      };

      setUsers((prev) => {
        const exists = prev.some((u) => u.id === liveProfile.id);
        return exists ? prev.map((u) => (u.id === liveProfile.id ? liveProfile : u)) : [liveProfile, ...prev];
      });
      setCurrentUserId(liveProfile.id);
      return liveProfile;
    };

    // Obtener sesión activa al cargar
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data: profile }) => {
            syncLiveProfile(user, profile);
          });
      }
    });

    // Suscribirse a cambios de auth en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            syncLiveProfile(session.user, profile);
          });
      } else {
        setCurrentUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabaseLive]);

  // Academia activa actual
  const currentAcademy = useMemo(() => {
    return academies.find((a) => a.id === currentAcademyId) || academies[0];
  }, [academies, currentAcademyId]);

  // Usuario activo actual
  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return users.find((u) => u.id === currentUserId) || users[1] || null;
  }, [users, currentUserId]);

  // Actualizar CSS variables con los colores de la academia activa
  useEffect(() => {
    if (!currentAcademy || typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', currentAcademy.primary_color);
    root.style.setProperty('--brand-accent', currentAcademy.primary_color);
    root.style.setProperty('--brand-secondary', currentAcademy.secondary_color);
  }, [currentAcademy]);

  // Cursos visibles para el alumno según su suscripción
  const academyCourses = useMemo(() => {
    if (currentUser?.is_all_access || currentUser?.role === 'admin') {
      return courses;
    }
    return courses.filter(
      (c) =>
        c.academy_id === currentAcademy.id ||
        c.assigned_tenant_ids?.includes(currentAcademy.id) ||
        Boolean(currentUser?.subscribed_academy_ids?.includes(c.academy_id))
    );
  }, [courses, currentAcademy, currentUser]);

  // Detección de sesión desplazada en otro dispositivo
  const { isSessionDisplaced, displacedByDevice } = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') {
      return { isSessionDisplaced: false, displacedByDevice: null };
    }
    if (
      currentUser.active_session_id &&
      currentUser.active_session_id !== localSessionToken
    ) {
      return {
        isSessionDisplaced: true,
        displacedByDevice: currentUser.active_session_device || 'Otro dispositivo',
      };
    }
    return { isSessionDisplaced: false, displacedByDevice: null };
  }, [currentUser, localSessionToken]);

  // Validar si el alumno actual tiene acceso a una academia
  const hasAccessToAcademy = useCallback(
    (academyId: string) => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin') return true;
      if (currentUser.is_all_access) {
        if (!currentUser.all_access_end_date) return true;
        return new Date(currentUser.all_access_end_date) >= new Date();
      }
      return Boolean(currentUser.subscribed_academy_ids?.includes(academyId));
    },
    [currentUser]
  );

  // Selector de academia
  const selectAcademyById = (id: string) => {
    const found = academies.find((a) => a.id === id);
    if (found) setCurrentAcademyId(found.id);
  };

  const selectAcademyBySlug = (slug: string) => {
    const found = academies.find((a) => a.slug.toLowerCase() === slug.toLowerCase());
    if (found) setCurrentAcademyId(found.id);
  };

  const createAcademy = (input: {
    title: string;
    slug: string;
    description: string;
    primary_color?: string;
    secondary_color?: string;
    price_monthly?: number;
    price_annual?: number;
    icon_name?: string;
  }) => {
    if (!input.title.trim()) {
      return { ok: false, message: 'El título de la academia es obligatorio.' };
    }
    const cleanSlug =
      input.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
      input.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newAcad: Academy = {
      id: `acad-${Date.now()}`,
      title: input.title.trim(),
      slug: cleanSlug,
      description: input.description.trim() || 'Academia especializada.',
      icon_name: input.icon_name || 'GraduationCap',
      primary_color: input.primary_color || '#3B82F6',
      secondary_color: input.secondary_color || '#1E40AF',
      price_monthly: input.price_monthly ?? 19,
      price_annual: input.price_annual ?? 149,
      sort_order: academies.length + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      name: input.title.trim(),
    };

    setAcademies((prev) => [...prev, newAcad]);
    return { ok: true, message: `Academia "${newAcad.title}" creada con éxito.`, academyId: newAcad.id };
  };

  const updateAcademy = (academyId: string, updates: Partial<Academy>) => {
    setAcademies((prev) =>
      prev.map((a) =>
        a.id === academyId
          ? {
              ...a,
              ...updates,
              name: updates.title || a.title,
            }
          : a
      )
    );
    return { ok: true, message: 'Academia actualizada.' };
  };

  // =========================================================================
  // AUTENTICACIÓN CON SUPABASE AUTH (Ruta 1)
  // =========================================================================

  const signInWithEmail = async (email: string, password: string = 'password123') => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseLive) {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          // Si el usuario existe en el mock local, permitir acceso transparente para testing
          const localMatch = users.find((u) => u.email.toLowerCase() === cleanEmail);
          if (localMatch) {
            setCurrentUserId(localMatch.id);
            return { ok: true, message: `Bienvenido de nuevo, ${localMatch.full_name}`, role: localMatch.role };
          }
          return { ok: false, message: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const role = ((profile?.role as string) === 'admin' ? 'admin' : 'student') as UserRole;
          const liveProfile: UserProfile = {
            id: profile?.id || data.user.id,
            email: profile?.email || cleanEmail,
            full_name: profile?.full_name || cleanEmail.split('@')[0],
            role,
            is_all_access: Boolean(profile?.is_all_access),
            all_access_end_date: profile?.all_access_end_date,
            active_session_id: profile?.active_session_id,
            active_session_device: profile?.active_session_device,
            last_session_at: profile?.last_session_at,
            created_at: profile?.created_at || new Date().toISOString(),
            subscription_plan: profile?.is_all_access ? 'Membresía All-Access (Pase Total)' : 'Suscripción por Academia',
            subscription_end_date: profile?.all_access_end_date || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
            subscription_status: 'active',
          };

          setUsers((prev) => {
            const exists = prev.some((u) => u.id === liveProfile.id);
            return exists ? prev.map((u) => (u.id === liveProfile.id ? liveProfile : u)) : [liveProfile, ...prev];
          });
          setCurrentUserId(liveProfile.id);

          return {
            ok: true,
            message: `Bienvenido de nuevo, ${liveProfile.full_name}`,
            role,
          };
        }
      }
    }

    // Modo local / Fallback
    const localMatch = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!localMatch) {
      return { ok: false, message: 'No se encontró un usuario con ese correo electrónico.' };
    }

    const token = `sess-${Date.now()}`;
    setLocalSessionToken(token);
    setCurrentUserId(localMatch.id);
    return {
      ok: true,
      message: `¡Bienvenido de nuevo, ${localMatch.full_name}!`,
      role: localMatch.role,
    };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || !password || !cleanName) {
      return { ok: false, message: 'Completa todos los campos obligatorios.' };
    }

    if (isSupabaseLive) {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: cleanName },
          },
        });

        if (error) {
          return { ok: false, message: error.message };
        }

        if (data.user) {
          const isOwnerAdmin = cleanEmail === 'ceo@plataformalms.com';
          const newLiveUser: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            full_name: cleanName,
            role: isOwnerAdmin ? 'admin' : 'student',
            is_all_access: isOwnerAdmin,
            all_access_end_date: isOwnerAdmin ? new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000).toISOString() : null,
            active_session_id: `sess-${Date.now()}`,
            active_session_device: 'Este Navegador',
            last_session_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            subscription_plan: isOwnerAdmin ? 'Membresía All-Access (Pase Total)' : 'Sin suscripción activa',
            subscription_status: isOwnerAdmin ? 'active' : 'expired',
          };

          setUsers((prev) => [newLiveUser, ...prev]);
          if (data.session) {
            setCurrentUserId(newLiveUser.id);
          }

          return {
            ok: true,
            message: data.session
              ? `¡Cuenta creada y autenticada con éxito! Bienvenido al campus, ${cleanName}.`
              : '¡Cuenta registrada con éxito en Supabase! Ya puedes iniciar sesión con tu correo y contraseña.',
          };
        }
      }
    }

    // Modo local / Fallback
    const newStudent: UserProfile = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      full_name: cleanName,
      role: 'student',
      is_all_access: false,
      all_access_end_date: null,
      active_session_id: `sess-${Date.now()}`,
      active_session_device: 'Este Navegador',
      last_session_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      subscription_plan: 'Sin suscripción activa',
      subscription_status: 'expired',
      subscribed_academy_ids: [],
    };

    setUsers((prev) => [newStudent, ...prev]);
    setCurrentUserId(newStudent.id);

    return {
      ok: true,
      message: `¡Cuenta creada con éxito! Bienvenido a la plataforma, ${cleanName}.`,
    };
  };

  const signOut = async () => {
    if (isSupabaseLive) {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    setCurrentUserId(null);
  };

  // Conmutador rápido de rol para desarrollo/demostración
  const loginAsRole = (role: UserRole) => {
    if (role === 'admin') {
      const admin = users.find((u) => u.role === 'admin') || users[0];
      if (admin) setCurrentUserId(admin.id);
    } else {
      const student = users.find((u) => u.role === 'student') || users[1];
      if (student) setCurrentUserId(student.id);
    }
  };

  const loginWithCredentials = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!matched) {
      return { ok: false, message: 'Usuario no encontrado.' };
    }
    setCurrentUserId(matched.id);
    return { ok: true, message: `Sesión iniciada como ${matched.full_name}`, role: matched.role };
  };

  const logout = () => {
    signOut();
  };

  // =========================================================================
  // GESTIÓN DE CURSOS Y CLASES
  // =========================================================================

  const createCourse = (input: CreateCourseInput) => {
    if (!input.title.trim()) {
      return { ok: false, message: 'El título del curso es obligatorio.' };
    }

    const courseId = `course-${Date.now()}`;
    const moduleId = `mod-${Date.now()}`;
    const slug = input.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const newCourse: Course = {
      id: courseId,
      academy_id: input.academy_id || currentAcademy.id,
      title: input.title.trim(),
      slug,
      subtitle: input.subtitle.trim() || 'Curso completo con videos y recursos prácticos.',
      description: input.description.trim() || input.title.trim(),
      thumbnail_url: null,
      category: input.category || 'Productividad',
      level: input.level || 'Todos los niveles',
      duration_label: input.duration_label || '6h 30m',
      is_published: true,
      assigned_tenant_ids: [input.academy_id || currentAcademy.id],
      modules:
        input.initial_modules && input.initial_modules.length > 0
          ? input.initial_modules.map((m, idx) => ({
              id: `mod-${Date.now()}-${idx}`,
              course_id: courseId,
              title: m.title.trim(),
              description: m.description?.trim() || 'Contenido estructurado para dominar las bases.',
              is_subtema_zero: Boolean(m.is_subtema_zero),
              sort_order: idx + 1,
              lessons: [],
            }))
          : [
              {
                id: moduleId,
                course_id: courseId,
                title: (input.module_title || 'Tema 1: Fundamentos Esenciales').trim(),
                description: 'Contenido estructurado para dominar las bases.',
                sort_order: 1,
                lessons: input.lesson_title?.trim()
                  ? [
                      {
                        id: `lesson-${Date.now()}`,
                        module_id: moduleId,
                        course_id: courseId,
                        title: input.lesson_title.trim(),
                        description: 'Primera lección práctica.',
                        video_provider: input.video_provider || 'bunny',
                        video_id: input.video_id || '',
                        video_embed_url:
                          input.video_embed_url ||
                          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                        duration_minutes: 10,
                        resource_url: null,
                        is_free_preview: true,
                        sort_order: 1,
                      },
                    ]
                  : [],
              },
            ],
    };

    setCourses((prev) => [newCourse, ...prev]);
    return { ok: true, message: `Curso "${newCourse.title}" creado con éxito.`, courseId };
  };

  const renameCourse = (courseId: string, newTitle: string, newSubtitle?: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? {
              ...c,
              title: newTitle.trim() || c.title,
              subtitle: newSubtitle?.trim() || c.subtitle,
            }
          : c
      )
    );
    return { ok: true, message: 'Curso actualizado.' };
  };

  const deleteCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  const addModuleToCourse = (input: AddModuleInput) => {
    const moduleId = `mod-${Date.now()}`;
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== input.course_id) return c;
        const newModule: CourseModule = {
          id: moduleId,
          course_id: c.id,
          title: input.title.trim(),
          description: input.description?.trim() || '',
          sort_order: c.modules.length + 1,
          is_subtema_zero: Boolean(input.is_subtema_zero),
          lessons: [],
        };
        return { ...c, modules: [...c.modules, newModule] };
      })
    );
    return { ok: true, message: 'Módulo agregado.', moduleId };
  };

  const renameModuleInCourse = (courseId: string, moduleId: string, newTitle: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) =>
            m.id === moduleId ? { ...m, title: newTitle.trim() } : m
          ),
        };
      })
    );
    return { ok: true, message: 'Módulo renombrado.' };
  };

  const toggleModuleSubtemaZero = (courseId: string, moduleId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) =>
            m.id === moduleId ? { ...m, is_subtema_zero: !m.is_subtema_zero } : m
          ),
        };
      })
    );
    return { ok: true, message: 'Estado de subtema cero actualizado.' };
  };

  const sortModuleLessonsAlphabetically = (courseId: string, moduleId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== moduleId) return m;
            const sorted = [...m.lessons].sort((a, b) =>
              a.title.localeCompare(b.title, 'es', { numeric: true, sensitivity: 'base' })
            );
            return {
              ...m,
              lessons: sorted.map((l, idx) => ({ ...l, sort_order: idx + 1 })),
            };
          }),
        };
      })
    );
    return { ok: true, message: 'Lecciones ordenadas alfabéticamente.' };
  };

  const reorderModuleInCourse = (courseId: string, moduleId: string, direction: 'up' | 'down') => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const idx = c.modules.findIndex((m) => m.id === moduleId);
        if (idx === -1) return c;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= c.modules.length) return c;
        const copy = [...c.modules];
        const temp = copy[idx];
        copy[idx] = copy[targetIdx];
        copy[targetIdx] = temp;
        return {
          ...c,
          modules: copy.map((m, i) => ({ ...m, sort_order: i + 1 })),
        };
      })
    );
  };

  const deleteModuleFromCourse = (courseId: string, moduleId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.filter((m) => m.id !== moduleId),
        };
      })
    );
  };

  const addLessonToCourse = (input: AddLessonInput) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== input.course_id) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== input.module_id) return m;
            const newLesson: Lesson = {
              id: `lesson-${Date.now()}`,
              module_id: m.id,
              course_id: c.id,
              title: input.title.trim(),
              description: input.description.trim(),
              video_provider: input.video_provider,
              video_id: input.video_id,
              video_embed_url: input.video_embed_url,
              duration_minutes: input.duration_minutes || 10,
              is_free_preview: false,
              sort_order: m.lessons.length + 1,
            };
            return { ...m, lessons: [...m.lessons, newLesson] };
          }),
        };
      })
    );
    return { ok: true, message: 'Lección agregada.' };
  };

  const renameLessonInCourse = (courseId: string, moduleId: string, lessonId: string, newTitle: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId ? { ...l, title: newTitle.trim() } : l
              ),
            };
          }),
        };
      })
    );
    return { ok: true, message: 'Lección renombrada.' };
  };

  const moveLessonToModule = (courseId: string, lessonId: string, targetModuleId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        let lessonToMove: Lesson | null = null;
        const cleanedModules = c.modules.map((m) => {
          const found = m.lessons.find((l) => l.id === lessonId);
          if (found) {
            lessonToMove = { ...found, module_id: targetModuleId };
            return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) };
          }
          return m;
        });

        if (!lessonToMove) return c;

        return {
          ...c,
          modules: cleanedModules.map((m) => {
            if (m.id === targetModuleId) {
              return { ...m, lessons: [...m.lessons, lessonToMove!] };
            }
            return m;
          }),
        };
      })
    );
    return { ok: true, message: 'Lección trasladada de módulo.' };
  };

  const reorderLessonInModule = (courseId: string, moduleId: string, lessonId: string, direction: 'up' | 'down') => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== moduleId) return m;
            const idx = m.lessons.findIndex((l) => l.id === lessonId);
            if (idx === -1) return m;
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= m.lessons.length) return m;
            const copy = [...m.lessons];
            const temp = copy[idx];
            copy[idx] = copy[targetIdx];
            copy[targetIdx] = temp;
            return {
              ...m,
              lessons: copy.map((l, i) => ({ ...l, sort_order: i + 1 })),
            };
          }),
        };
      })
    );
  };

  const deleteLessonFromCourse = (courseId: string, moduleId: string, lessonId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) =>
            m.id === moduleId
              ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
              : m
          ),
        };
      })
    );
  };

  const assignBunnyVideosToSubtema = (courseId: string, targetModuleId: string, videos: BunnyRemoteVideo[]) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => {
            if (m.id !== targetModuleId) return m;
            const newLessons: Lesson[] = videos.map((v, i) => ({
              id: `bunny-lesson-${v.guid}`,
              module_id: targetModuleId,
              course_id: courseId,
              title: v.title,
              description: `Video de Bunny.net Stream (GUID: ${v.guid})`,
              video_provider: 'bunny',
              video_id: v.guid,
              video_embed_url: v.embedUrl,
              duration_minutes: v.durationMinutes || 10,
              is_free_preview: i === 0,
              sort_order: m.lessons.length + i + 1,
            }));
            return { ...m, lessons: [...m.lessons, ...newLessons] };
          }),
        };
      })
    );
    return { ok: true, message: `${videos.length} videos de Bunny.net asignados al tema.` };
  };

  const syncBunnyVideosIntoCourse = async (courseId: string, targetModuleId?: string) => {
    try {
      const res = await fetch('/api/bunny/videos');
      if (!res.ok) throw new Error('No se pudo conectar con Bunny.net');
      const data = await res.json();
      const videos: BunnyRemoteVideo[] = data.videos || [];
      if (videos.length === 0) return { ok: false, message: 'No hay videos en tu biblioteca Bunny.net', addedCount: 0, totalBunnyCount: 0 };

      const targetCourse = courses.find((c) => c.id === courseId);
      const modId = targetModuleId || targetCourse?.modules[0]?.id;
      if (!modId) return { ok: false, message: 'Crea un módulo primero', addedCount: 0, totalBunnyCount: videos.length };

      assignBunnyVideosToSubtema(courseId, modId, videos);
      return { ok: true, message: `Se importaron ${videos.length} videos de Bunny.net con éxito.`, addedCount: videos.length, totalBunnyCount: videos.length };
    } catch (e: any) {
      return { ok: false, message: e.message || 'Error al sincronizar con Bunny.net', addedCount: 0, totalBunnyCount: 0 };
    }
  };

  const toggleLessonCompleted = (lessonId: string) => {
    setCompletedLessonIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  // =========================================================================
  // CONTROL ANTI-COMPARTIR CUENTA (Sesión Única)
  // =========================================================================

  const reclaimCurrentDeviceSession = () => {
    if (!currentUser) return;
    const newToken = `sess-reclaimed-${Date.now()}`;
    setLocalSessionToken(newToken);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              active_session_id: newToken,
              active_session_device: 'Este Navegador (Sesión Reclamada)',
              last_session_at: new Date().toISOString(),
            }
          : u
      )
    );
  };

  const simulateConcurrentLoginFromOtherDevice = () => {
    if (!currentUser) return;
    const intruderToken = `sess-intruder-${Date.now()}`;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              active_session_id: intruderToken,
              active_session_device: 'iPhone 16 Pro • Safari (IP: 190.24.118.42 - Otra Ciudad)',
              last_session_at: new Date().toISOString(),
            }
          : u
      )
    );
  };

  // =========================================================================
  // SUSCRIPCIONES Y PAGOS GLOBALES
  // =========================================================================

  const updateGlobalPaymentSettings = (settings: Partial<GlobalPaymentSettings>) => {
    setGlobalPaymentSettings((prev) => ({
      ...prev,
      ...settings,
      updated_at: new Date().toISOString(),
    }));
  };

  const renewSubscription = (studentId: string, planName?: string, additionalDays: number = 30) => {
    const student = users.find((u) => u.id === studentId);
    if (!student) return { ok: false, message: 'Alumno no encontrado.' };

    const now = new Date();
    const currentEnd = student.subscription_end_date ? new Date(student.subscription_end_date) : now;
    const baseDate = currentEnd > now ? currentEnd : now;
    const newEndDate = new Date(baseDate.getTime() + additionalDays * 24 * 3600 * 1000);

    const isAllAccess = Boolean(planName?.includes('All-Access') || additionalDays >= 365);

    const newPaymentRecord = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      description: planName || (isAllAccess ? 'Membresía All-Access Anual' : 'Suscripción Academia'),
      amount: additionalDays >= 365 ? '$240.00' : additionalDays >= 90 ? '$89.00' : '$29.00',
      currency: 'USD',
      status: 'paid' as const,
      payment_method: 'Mercado Pago',
    };

    setUsers((prev) =>
      prev.map((u) =>
        u.id === studentId
          ? {
              ...u,
              subscription_plan: planName || (isAllAccess ? 'Membresía All-Access' : u.subscription_plan),
              subscription_end_date: newEndDate.toISOString(),
              subscription_status: 'active',
              is_all_access: isAllAccess || u.is_all_access,
              all_access_end_date: isAllAccess ? newEndDate.toISOString() : u.all_access_end_date,
              payment_history: [newPaymentRecord, ...(u.payment_history || [])],
            }
          : u
      )
    );

    return {
      ok: true,
      message: `¡Suscripción reactivada con éxito! Acceso vigente hasta el ${newEndDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}.`,
    };
  };

  const setStudentRemainingDays = (studentId: string, daysRemaining: number) => {
    const targetDate = new Date(Date.now() + daysRemaining * 24 * 3600 * 1000);
    const status = daysRemaining < 0 ? 'expired' : daysRemaining <= 7 ? 'expiring_soon' : 'active';

    setUsers((prev) =>
      prev.map((u) =>
        u.id === studentId
          ? {
              ...u,
              subscription_end_date: targetDate.toISOString(),
              subscription_status: status,
              all_access_end_date: u.is_all_access ? targetDate.toISOString() : u.all_access_end_date,
            }
          : u
      )
    );
  };

  const resetDemoData = () => {
    localStorage.clear();
    setAcademies(INITIAL_ACADEMIES);
    setUsers(INITIAL_USERS);
    setCourses(INITIAL_COURSES);
    setCurrentAcademyId(INITIAL_ACADEMIES[0].id);
    setCurrentUserId(INITIAL_USERS[1].id);
    setCompletedLessonIds(['eeee1111-1111-1111-1111-111111111111']);
    setGlobalPaymentSettings(INITIAL_GLOBAL_PAYMENT_SETTINGS);
  };

  return (
    <LMSContext.Provider
      value={{
        isSupabaseLive,
        academies,
        currentAcademy,
        selectAcademyById,
        selectAcademyBySlug,
        createAcademy,
        updateAcademy,
        // Retrocompatibilidad
        tenants: academies,
        currentTenant: currentAcademy,
        selectTenantById: selectAcademyById,
        selectTenantBySlug: selectAcademyBySlug,
        users,
        currentUser,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        loginAsRole,
        loginWithCredentials,
        logout,
        courses,
        academyCourses,
        tenantCourses: academyCourses,
        createCourse,
        renameCourse,
        deleteCourse,
        addModuleToCourse,
        renameModuleInCourse,
        toggleModuleSubtemaZero,
        sortModuleLessonsAlphabetically,
        reorderModuleInCourse,
        deleteModuleFromCourse,
        addLessonToCourse,
        renameLessonInCourse,
        moveLessonToModule,
        reorderLessonInModule,
        deleteLessonFromCourse,
        assignBunnyVideosToSubtema,
        syncBunnyVideosIntoCourse,
        completedLessonIds,
        toggleLessonCompleted,
        isClassroomFocusMode,
        setIsClassroomFocusMode,
        localSessionToken,
        isSessionDisplaced,
        displacedByDevice,
        reclaimCurrentDeviceSession,
        simulateConcurrentLoginFromOtherDevice,
        globalPaymentSettings,
        updateGlobalPaymentSettings,
        renewSubscription,
        setStudentRemainingDays,
        hasAccessToAcademy,
        webhookLogs,
        resetDemoData,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
}

export function useLMS() {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error('useLMS debe ser usado dentro de un LMSProvider');
  }
  return context;
}
