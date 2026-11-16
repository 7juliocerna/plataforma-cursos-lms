'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Course,
  CourseModule,
  Lesson,
  SubscriptionWebhookLog,
  Tenant,
  UserProfile,
  UserRole,
  VideoProviderType,
} from '@/types/lms';
import {
  INITIAL_COURSES,
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_WEBHOOK_LOGS,
} from '@/lib/mock-data';
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface CreateTenantInput {
  name: string;
  slug: string;
  custom_domain?: string;
  primary_color: string;
  tagline: string;
  support_email: string;
  plan_name: string;
  max_licenses: number;
  assigned_course_ids: string[];
}

interface UpdateBrandingInput {
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  tagline: string;
  support_email: string;
}

interface CreateStudentInput {
  full_name: string;
  email: string;
  tenant_id: string;
}

interface CreateCourseInput {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  duration_label: string;
  module_title: string;
  lesson_title?: string;
  video_provider?: VideoProviderType;
  video_id?: string;
  video_embed_url?: string;
  assigned_tenant_ids: string[];
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

export interface BunnyRemoteVideo {
  guid: string;
  title: string;
  collectionId?: string | null;
  collectionName?: string | null;
  durationMinutes: number;
  embedUrl: string;
}

interface LMSContextType {
  isSupabaseLive: boolean;
  tenants: Tenant[];
  currentTenant: Tenant;
  users: UserProfile[];
  currentUser: UserProfile | null;
  courses: Course[];
  tenantCourses: Course[];
  webhookLogs: SubscriptionWebhookLog[];
  completedLessonIds: string[];
  localSessionToken: string;
  isSessionDisplaced: boolean;
  displacedByDevice: string | null;
  // Acciones de Tenant / Marca Blanca
  selectTenantById: (tenantId: string) => void;
  selectTenantBySlug: (slug: string) => void;
  createTenant: (input: CreateTenantInput) => { ok: boolean; message: string };
  updateTenantBranding: (tenantId: string, input: UpdateBrandingInput) => { ok: boolean; message: string };
  updateTenantLicenseLimit: (tenantId: string, newMaxLicenses: number, planName?: string) => void;
  toggleCourseForTenant: (tenantId: string, courseId: string) => void;
  // Acciones de Autenticación y Roles
  loginAsRole: (role: UserRole, tenantId?: string) => void;
  loginWithCredentials: (email: string) => { ok: boolean; message: string; role?: UserRole };
  logout: () => void;
  // Acciones de Control de Licencias de Alumnos
  createStudent: (input: CreateStudentInput) => { ok: boolean; message: string };
  toggleStudentActiveStatus: (studentId: string) => { ok: boolean; message: string };
  // Acciones Anti-Compartir Cuenta (Sesión Única)
  simulateConcurrentLoginFromOtherDevice: () => void;
  reclaimCurrentDeviceSession: () => void;
  // Acciones de Cursos, Constructor de Subtemas (Módulos) y Clases
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
  assignBunnyVideosToSubtema: (
    courseId: string,
    targetModuleId: string,
    videos: BunnyRemoteVideo[]
  ) => { ok: boolean; message: string };
  syncBunnyVideosIntoCourse: (
    courseId: string,
    targetModuleId?: string
  ) => Promise<{ ok: boolean; message: string; addedCount: number; totalBunnyCount: number }>;
  toggleLessonCompleted: (lessonId: string) => void;
  // Simulación de Webhooks Stripe / Mercado Pago
  triggerSimulatedWebhook: (provider: 'stripe' | 'mercadopago', tenantId: string, licensesToAdd: number) => void;
  resetDemoData: () => void;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TENANTS: 'lms_wl_tenants_v1',
  USERS: 'lms_wl_users_v1',
  COURSES: 'lms_wl_courses_v5_subtema_builder',
  CURRENT_TENANT_ID: 'lms_wl_current_tenant_id_v1',
  CURRENT_USER_ID: 'lms_wl_current_user_id_v1',
  COMPLETED_LESSONS: 'lms_wl_completed_lessons_v1',
  WEBHOOK_LOGS: 'lms_wl_webhook_logs_v1',
  LOCAL_SESSION_TOKEN: 'lms_wl_local_session_token_v1',
};

function compareLessonTitles(a: string, b: string) {
  return a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' });
}

export function LMSProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [webhookLogs, setWebhookLogs] = useState<SubscriptionWebhookLog[]>(INITIAL_WEBHOOK_LOGS);
  const [currentTenantId, setCurrentTenantId] = useState<string>(INITIAL_TENANTS[1].id);
  const [currentUserId, setCurrentUserId] = useState<string | null>(INITIAL_USERS[2].id);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([
    'eeee1111-1111-1111-1111-111111111111',
  ]);
  const [localSessionToken, setLocalSessionToken] = useState<string>('sess-st-laura-991');
  const [isHydrated, setIsHydrated] = useState(false);

  const isSupabaseLive = isSupabaseConfigured();

  // Hidratación desde localStorage
  useEffect(() => {
    try {
      const savedTenants = localStorage.getItem(STORAGE_KEYS.TENANTS);
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const savedCourses = localStorage.getItem(STORAGE_KEYS.COURSES);
      const savedTenantId = localStorage.getItem(STORAGE_KEYS.CURRENT_TENANT_ID);
      const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const savedCompleted = localStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS);
      const savedWebhooks = localStorage.getItem(STORAGE_KEYS.WEBHOOK_LOGS);
      const savedSessionToken = localStorage.getItem(STORAGE_KEYS.LOCAL_SESSION_TOKEN);

      const loadedTenants: Tenant[] = savedTenants ? JSON.parse(savedTenants) : INITIAL_TENANTS;
      if (savedTenants) setTenants(loadedTenants);
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      if (savedCourses) setCourses(JSON.parse(savedCourses));
      if (savedTenantId) setCurrentTenantId(savedTenantId);
      if (savedUserId) setCurrentUserId(savedUserId);
      if (savedCompleted) setCompletedLessonIds(JSON.parse(savedCompleted));
      if (savedWebhooks) setWebhookLogs(JSON.parse(savedWebhooks));
      if (savedSessionToken) setLocalSessionToken(savedSessionToken);

      const params = new URLSearchParams(window.location.search);
      const tenantSlugParam = params.get('tenant');
      if (tenantSlugParam) {
        const matched = loadedTenants.find(
          (t) => t.slug.toLowerCase() === tenantSlugParam.toLowerCase()
        );
        if (matched) {
          setCurrentTenantId(matched.id);
        }
      }
    } catch (e) {
      console.error('Error hidratando estado LMS:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Asignar en lote varios videos de Bunny a un Subtema específico elegido por el usuario
  const assignBunnyVideosToSubtema = useCallback(
    (courseId: string, targetModuleId: string, videosToAssign: BunnyRemoteVideo[]) => {
      if (videosToAssign.length === 0) {
        return { ok: false, message: 'Selecciona al menos un video de Bunny.' };
      }

      const targetVideoGuids = new Set(videosToAssign.map((v) => v.guid));

      setCourses((prevCourses) =>
        prevCourses.map((course) => {
          if (course.id !== courseId) return course;

          // 1. Quitar esos videos si estaban en otro subtema de este mismo curso (para moverlos limpiamente)
          const cleanedModules = course.modules.map((mod) => ({
            ...mod,
            lessons: mod.lessons.filter((l) => !targetVideoGuids.has(l.video_id)),
          }));

          // 2. Insertarlos en el Subtema destino elegido por el usuario
          const updatedModules = cleanedModules.map((mod) => {
            if (mod.id !== targetModuleId) return mod;

            const newLessons: Lesson[] = videosToAssign.map((bv, idx) => {
              const cleanTitle = bv.title.replace(/\.(mp4|mov|mkv|webm)$/i, '').trim();
              return {
                id: `les-bunny-${bv.guid}`,
                module_id: mod.id,
                course_id: courseId,
                title: cleanTitle,
                description: `Clase práctica de "${mod.title}".`,
                video_provider: 'bunny',
                video_id: bv.guid,
                video_embed_url: bv.embedUrl,
                duration_minutes: bv.durationMinutes,
                resource_url: '/recursos/guia-practica-clase.pdf',
                is_free_preview: mod.lessons.length === 0 && idx === 0,
                sort_order: mod.lessons.length + idx + 1,
              };
            });

            const merged = [...mod.lessons, ...newLessons].sort((a, b) =>
              compareLessonTitles(a.title, b.title)
            );

            return {
              ...mod,
              lessons: merged,
            };
          });

          return {
            ...course,
            modules: updatedModules,
          };
        })
      );

      return {
        ok: true,
        message: `¡${videosToAssign.length} video(s) asignados al Tema correctamente! Ya están visibles en el Portal del Alumno.`,
      };
    },
    []
  );

  // Sincronizar videos nuevos de Bunny que aún no estén en el curso (sin sobrescribir los subtemas creados por el usuario)
  const syncBunnyVideosIntoCourse = useCallback(
    async (courseId: string, targetModuleId?: string) => {
      try {
        const res = await fetch('/api/bunny/videos');
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.videos)) {
          return {
            ok: false,
            message: data.message || 'No se pudieron obtener videos de Bunny Stream.',
            addedCount: 0,
            totalBunnyCount: 0,
          };
        }

        const remoteVideos: BunnyRemoteVideo[] = [...data.videos].sort((a, b) =>
          compareLessonTitles(a.title, b.title)
        );

        let addedCount = 0;

        setCourses((prevCourses) =>
          prevCourses.map((course) => {
            if (course.id !== courseId) return course;

            const existingVideoIds = new Set(
              course.modules.flatMap((m) => m.lessons.map((l) => l.video_id))
            );

            const updatedModules: CourseModule[] = course.modules.map((m) => ({
              ...m,
              lessons: [...m.lessons],
            }));

            for (const bv of remoteVideos) {
              const cleanTitle = bv.title.replace(/\.(mp4|mov|mkv|webm)$/i, '').trim();

              if (existingVideoIds.has(bv.guid)) {
                continue;
              }

              let destModule: CourseModule | undefined;

              if (targetModuleId) {
                destModule = updatedModules.find((m) => m.id === targetModuleId);
              } else {
                const matchPrefix = cleanTitle.match(/^(\d+)\./);
                const moduleNumber = matchPrefix ? Number(matchPrefix[1]) : 1;
                destModule = updatedModules[moduleNumber - 1];

                if (!destModule && moduleNumber > 1) {
                  const newMod: CourseModule = {
                    id: `mod-auto-${courseId}-${moduleNumber}-${Date.now()}`,
                    course_id: courseId,
                    title: bv.collectionName || `Subtema ${moduleNumber}`,
                    description: `Clases del subtema ${moduleNumber}`,
                    sort_order: updatedModules.length + 1,
                    lessons: [],
                  };
                  updatedModules.push(newMod);
                  destModule = newMod;
                }
              }

              if (!destModule) {
                if (updatedModules.length === 0) {
                  const firstMod: CourseModule = {
                    id: `mod-init-${courseId}`,
                    course_id: courseId,
                    title: 'Subtema 1: Introducción',
                    description: 'Videos del curso',
                    sort_order: 1,
                    lessons: [],
                  };
                  updatedModules.push(firstMod);
                }
                destModule = updatedModules[0];
              }

              const newLesson: Lesson = {
                id: `les-bunny-${bv.guid}`,
                module_id: destModule.id,
                course_id: courseId,
                title: cleanTitle,
                description: `Clase práctica transmitida desde Bunny.net Stream (${cleanTitle}).`,
                video_provider: 'bunny',
                video_id: bv.guid,
                video_embed_url: bv.embedUrl,
                duration_minutes: bv.durationMinutes,
                resource_url: '/recursos/guia-practica-clase.pdf',
                is_free_preview: destModule.lessons.length === 0,
                sort_order: destModule.lessons.length + 1,
              };

              destModule.lessons.push(newLesson);
              existingVideoIds.add(bv.guid);
              addedCount++;
            }

            return {
              ...course,
              modules: updatedModules,
            };
          })
        );

        return {
          ok: true,
          message:
            addedCount > 0
              ? `¡Se importaron ${addedCount} nuevos videos de Bunny.net al curso!`
              : `Todos tus ${remoteVideos.length} videos de Bunny.net ya están cargados. Puedes moverlos entre tus Subtemas cuando quieras.`,
          addedCount,
          totalBunnyCount: remoteVideos.length,
        };
      } catch (e) {
        return {
          ok: false,
          message: `Error sincronizando videos de Bunny: ${String(e)}`,
          addedCount: 0,
          totalBunnyCount: 0,
        };
      }
    },
    []
  );

  // Si Supabase está configurado, sincronizar tenants reales al iniciar
  useEffect(() => {
    if (!isSupabaseLive) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTenants(data as Tenant[]);
        }
      });
  }, [isSupabaseLive]);

  // Persistir cambios en localStorage
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    localStorage.setItem(STORAGE_KEYS.CURRENT_TENANT_ID, currentTenantId);
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    }
    localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(completedLessonIds));
    localStorage.setItem(STORAGE_KEYS.WEBHOOK_LOGS, JSON.stringify(webhookLogs));
    localStorage.setItem(STORAGE_KEYS.LOCAL_SESSION_TOKEN, localSessionToken);
  }, [
    isHydrated,
    tenants,
    users,
    courses,
    currentTenantId,
    currentUserId,
    completedLessonIds,
    webhookLogs,
    localSessionToken,
  ]);

  const currentTenant = useMemo(() => {
    return tenants.find((t) => t.id === currentTenantId) || tenants[0];
  }, [tenants, currentTenantId]);

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return users.find((u) => u.id === currentUserId) || null;
  }, [users, currentUserId]);

  useEffect(() => {
    if (!currentTenant || typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', currentTenant.primary_color);
    root.style.setProperty('--brand-secondary', currentTenant.secondary_color);
    root.style.setProperty('--brand-accent', currentTenant.accent_color);
  }, [currentTenant]);

  const tenantCourses = useMemo(() => {
    if (!currentTenant) return [];
    return courses.filter((c) => c.assigned_tenant_ids.includes(currentTenant.id));
  }, [courses, currentTenant]);

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
        displacedByDevice: currentUser.active_session_device || 'Otro dispositivo desconocido',
      };
    }
    return { isSessionDisplaced: false, displacedByDevice: null };
  }, [currentUser, localSessionToken]);

  const selectTenantById = (tenantId: string) => {
    const target = tenants.find((t) => t.id === tenantId);
    if (!target) return;
    setCurrentTenantId(target.id);

    if (currentUser && currentUser.role !== 'superadmin' && currentUser.tenant_id !== target.id) {
      const matchingUser = users.find(
        (u) => u.tenant_id === target.id && u.role === currentUser.role
      );
      if (matchingUser) {
        setCurrentUserId(matchingUser.id);
        if (matchingUser.active_session_id) {
          setLocalSessionToken(matchingUser.active_session_id);
        }
      }
    }
  };

  const selectTenantBySlug = (slug: string) => {
    const found = tenants.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
    if (found) selectTenantById(found.id);
  };

  const createTenant = (input: CreateTenantInput) => {
    const cleanSlug = input.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');

    if (!input.name.trim() || !cleanSlug) {
      return { ok: false, message: 'El nombre y el subdominio (slug) son obligatorios.' };
    }

    if (tenants.some((t) => t.slug === cleanSlug)) {
      return { ok: false, message: 'Ese subdominio ya está registrado por otra academia.' };
    }

    const newTenantId = `tenant-${Date.now()}`;
    const newTenant: Tenant = {
      id: newTenantId,
      name: input.name.trim(),
      slug: cleanSlug,
      custom_domain: input.custom_domain?.trim() || null,
      logo_url: null,
      primary_color: input.primary_color || '#4F46E5',
      secondary_color: '#0F172A',
      accent_color: '#10B981',
      tagline:
        input.tagline.trim() ||
        'Formación especializada de alto impacto bajo nuestra metodología exclusiva',
      support_email: input.support_email.trim() || `soporte@${cleanSlug}.com`,
      plan_name: input.plan_name || `Pack Reseller ${input.max_licenses} Licencias`,
      plan_status: 'active',
      max_licenses: Number(input.max_licenses) || 25,
      used_licenses: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const newAdmin: UserProfile = {
      id: `user-admin-${Date.now()}`,
      tenant_id: newTenantId,
      role: 'reseller_admin',
      full_name: `Admin ${input.name.trim()}`,
      email: input.support_email.trim() || `admin@${cleanSlug}.com`,
      is_active: true,
      active_session_id: `sess-admin-${Date.now()}`,
      active_session_device: 'Chrome • Windows',
      last_session_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const newStudentSession = `sess-stu-${Date.now()}`;
    const newStudent: UserProfile = {
      id: `user-stu-${Date.now()}`,
      tenant_id: newTenantId,
      role: 'student',
      full_name: `Alumno Fundador (${input.name.trim()})`,
      email: `alumno1@${cleanSlug}.com`,
      is_active: true,
      active_session_id: newStudentSession,
      active_session_device: 'Chrome • Windows',
      last_session_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setTenants((prev) => [...prev, newTenant]);
    setUsers((prev) => [...prev, newAdmin, newStudent]);

    if (input.assigned_course_ids.length > 0) {
      setCourses((prev) =>
        prev.map((course) =>
          input.assigned_course_ids.includes(course.id) &&
          !course.assigned_tenant_ids.includes(newTenantId)
            ? { ...course, assigned_tenant_ids: [...course.assigned_tenant_ids, newTenantId] }
            : course
        )
      );
    }

    return {
      ok: true,
      message: `Academia "${newTenant.name}" creada con éxito con ${newTenant.max_licenses} licencias habilitadas.`,
    };
  };

  const updateTenantBranding = (tenantId: string, input: UpdateBrandingInput) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              name: input.name.trim() || t.name,
              slug: input.slug.trim().toLowerCase() || t.slug,
              custom_domain: input.custom_domain?.trim() || null,
              logo_url: input.logo_url?.trim() || null,
              primary_color: input.primary_color || t.primary_color,
              secondary_color: input.secondary_color || t.secondary_color,
              accent_color: input.accent_color || t.accent_color,
              tagline: input.tagline.trim() || t.tagline,
              support_email: input.support_email.trim() || t.support_email,
            }
          : t
      )
    );
    return {
      ok: true,
      message: 'Marca blanca actualizada en tiempo real.',
    };
  };

  const updateTenantLicenseLimit = (tenantId: string, newMaxLicenses: number, planName?: string) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              max_licenses: Math.max(1, newMaxLicenses),
              plan_name: planName || `Pack Reseller ${newMaxLicenses} Alumnos`,
              plan_status: 'active',
            }
          : t
      )
    );
  };

  const toggleCourseForTenant = (tenantId: string, courseId: string) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;
        const exists = course.assigned_tenant_ids.includes(tenantId);
        return {
          ...course,
          assigned_tenant_ids: exists
            ? course.assigned_tenant_ids.filter((id) => id !== tenantId)
            : [...course.assigned_tenant_ids, tenantId],
        };
      })
    );
  };

  const loginAsRole = (role: UserRole, tenantId?: string) => {
    const targetTenantId = tenantId || currentTenant.id;
    if (role === 'superadmin') {
      const sa = users.find((u) => u.role === 'superadmin');
      if (sa) setCurrentUserId(sa.id);
      return;
    }

    const foundUser = users.find(
      (u) => u.role === role && u.tenant_id === targetTenantId
    );
    if (foundUser) {
      const newToken = `sess-${Date.now()}`;
      setLocalSessionToken(newToken);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === foundUser.id
            ? {
                ...u,
                active_session_id: newToken,
                active_session_device: 'Este Navegador (Sesión Verificada)',
                last_session_at: new Date().toISOString(),
              }
            : u
        )
      );
      setCurrentUserId(foundUser.id);
    }
  };

  const loginWithCredentials = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!matched) {
      return {
        ok: false,
        message: 'No se encontró una cuenta con ese correo.',
      };
    }

    if (matched.role === 'student' && !matched.is_active) {
      return {
        ok: false,
        message: 'Tu licencia de alumno se encuentra desactivada por tu academia.',
      };
    }

    const newToken = `sess-${Date.now()}`;
    setLocalSessionToken(newToken);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === matched.id
          ? {
              ...u,
              active_session_id: newToken,
              active_session_device: 'Este Navegador (Sesión Verificada)',
              last_session_at: new Date().toISOString(),
            }
          : u
      )
    );
    setCurrentUserId(matched.id);
    if (matched.tenant_id) {
      setCurrentTenantId(matched.tenant_id);
    }
    return { ok: true, message: 'Sesión iniciada correctamente.', role: matched.role };
  };

  const logout = () => {
    setCurrentUserId(null);
  };

  const createStudent = (input: CreateStudentInput) => {
    const targetTenant = tenants.find((t) => t.id === input.tenant_id);
    if (!targetTenant) {
      return { ok: false, message: 'Academia no encontrada.' };
    }

    const activeStudentsCount = users.filter(
      (u) => u.tenant_id === targetTenant.id && u.role === 'student' && u.is_active
    ).length;

    if (activeStudentsCount >= targetTenant.max_licenses) {
      return {
        ok: false,
        message: `LÍMITE DE LICENCIAS ALCANZADO (${activeStudentsCount}/${targetTenant.max_licenses}). Debes desactivar a un alumno o ampliar tu plan de licencias.`,
      };
    }

    const cleanEmail = input.email.trim().toLowerCase();
    if (!input.full_name.trim() || !cleanEmail) {
      return { ok: false, message: 'Ingresa el nombre completo y el correo del alumno.' };
    }

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { ok: false, message: 'Ya existe un usuario registrado con ese correo electrónico.' };
    }

    const newStudent: UserProfile = {
      id: `student-${Date.now()}`,
      tenant_id: targetTenant.id,
      role: 'student',
      full_name: input.full_name.trim(),
      email: cleanEmail,
      is_active: true,
      active_session_id: `sess-init-${Date.now()}`,
      active_session_device: 'Pendiente de primer ingreso',
      last_session_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const nextActiveCount = activeStudentsCount + 1;
    setUsers((prev) => [...prev, newStudent]);
    setTenants((prev) =>
      prev.map((t) =>
        t.id === targetTenant.id ? { ...t, used_licenses: nextActiveCount } : t
      )
    );

    return {
      ok: true,
      message: `Alumno "${newStudent.full_name}" activado. Licencias en uso: ${nextActiveCount}/${targetTenant.max_licenses}.`,
    };
  };

  const toggleStudentActiveStatus = (studentId: string) => {
    const student = users.find((u) => u.id === studentId);
    if (!student || !student.tenant_id) {
      return { ok: false, message: 'Alumno no encontrado.' };
    }

    const targetTenant = tenants.find((t) => t.id === student.tenant_id);
    if (!targetTenant) {
      return { ok: false, message: 'Academia no encontrada.' };
    }

    const activeStudentsCount = users.filter(
      (u) => u.tenant_id === targetTenant.id && u.role === 'student' && u.is_active
    ).length;

    if (!student.is_active && activeStudentsCount >= targetTenant.max_licenses) {
      return {
        ok: false,
        message: `BLOQUEO DE LICENCIAS: Ya tienes ${activeStudentsCount} de ${targetTenant.max_licenses} licencias ocupadas.`,
      };
    }

    const nextState = !student.is_active;
    const nextActiveCount = nextState ? activeStudentsCount + 1 : Math.max(0, activeStudentsCount - 1);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === studentId
          ? {
              ...u,
              is_active: nextState,
              active_session_id: nextState ? u.active_session_id : null,
            }
          : u
      )
    );

    setTenants((prev) =>
      prev.map((t) =>
        t.id === targetTenant.id ? { ...t, used_licenses: nextActiveCount } : t
      )
    );

    return {
      ok: true,
      message: nextState
        ? `Licencia activada para ${student.full_name} (${nextActiveCount}/${targetTenant.max_licenses}).`
        : `Alumno ${student.full_name} dado de baja. Se liberó 1 licencia (${nextActiveCount}/${targetTenant.max_licenses}).`,
    };
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
              active_session_device: 'Smart TV / iPhone 16 Pro (IP: 190.24.118.42 - Otra Ubicación)',
              last_session_at: new Date().toISOString(),
            }
          : u
      )
    );
  };

  const reclaimCurrentDeviceSession = () => {
    if (!currentUser) return;
    const reclaimedToken = `sess-reclaimed-${Date.now()}`;
    setLocalSessionToken(reclaimedToken);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              active_session_id: reclaimedToken,
              active_session_device: 'Este Navegador (Sesión Recuperada)',
              last_session_at: new Date().toISOString(),
            }
          : u
      )
    );
  };

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

    const initialLessons: Lesson[] = input.lesson_title?.trim()
      ? [
          {
            id: `les-${Date.now()}`,
            module_id: moduleId,
            course_id: courseId,
            title: input.lesson_title.trim(),
            description: 'Clase en video alojada en Bunny.net Stream.',
            video_provider: input.video_provider || 'bunny',
            video_id: input.video_id?.trim() || 'stream-001',
            video_embed_url:
              input.video_embed_url?.trim() ||
              'https://iframe.mediadelivery.net/embed/808934/stream-001',
            duration_minutes: 5,
            resource_url: '/recursos/guia-clase.pdf',
            is_free_preview: true,
            sort_order: 1,
          },
        ]
      : [];

    const newCourse: Course = {
      id: courseId,
      owner_tenant_id: null,
      title: input.title.trim(),
      slug,
      subtitle: input.subtitle.trim() || 'Curso práctico organizado por subtemas',
      description: input.description.trim() || input.subtitle.trim(),
      category: input.category || 'Diseño & Edición Profesional',
      level: input.level || 'Intermedio',
      duration_label: input.duration_label || 'Curso Completo',
      is_published: true,
      assigned_tenant_ids:
        input.assigned_tenant_ids.length > 0
          ? input.assigned_tenant_ids
          : tenants.map((t) => t.id),
      modules: [
        {
          id: moduleId,
          course_id: courseId,
          title: input.module_title.trim() || 'Subtema 1: Introducción',
          description: 'Primer bloque temático del curso',
          sort_order: 1,
          lessons: initialLessons,
        },
      ],
    };

    setCourses((prev) => [newCourse, ...prev]);
    return {
      ok: true,
      message: `Curso "${newCourse.title}" creado con su primer Tema. Ahora puedes agregarle todos los temas y videos que quieras.`,
      courseId,
    };
  };

  const renameCourse = (courseId: string, newTitle: string, newSubtitle?: string) => {
    if (!newTitle.trim()) {
      return { ok: false, message: 'El nombre del curso no puede estar vacío.' };
    }
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? {
              ...c,
              title: newTitle.trim(),
              subtitle: newSubtitle !== undefined ? newSubtitle.trim() : c.subtitle,
            }
          : c
      )
    );
    return {
      ok: true,
      message: `Nombre del curso actualizado a "${newTitle.trim()}".`,
    };
  };

  const deleteCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  const addModuleToCourse = (input: AddModuleInput) => {
    if (!input.title.trim()) {
      return { ok: false, message: 'Escribe el nombre del Tema.' };
    }

    const newModuleId = `mod-${Date.now()}`;
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== input.course_id) return course;
        const nextOrder = input.is_subtema_zero ? 0 : course.modules.length + 1;
        const newMod: CourseModule = {
          id: newModuleId,
          course_id: course.id,
          title: input.title.trim(),
          description: input.description?.trim() || 'Tema del curso',
          sort_order: nextOrder,
          is_subtema_zero: Boolean(input.is_subtema_zero),
          lessons: [],
        };
        if (input.is_subtema_zero) {
          // Colocar el Tema 0 al inicio y desmarcar otros si hubiera
          const cleaned = course.modules.map((m) => ({
            ...m,
            is_subtema_zero: false,
          }));
          return {
            ...course,
            modules: [newMod, ...cleaned],
          };
        }
        return {
          ...course,
          modules: [...course.modules, newMod],
        };
      })
    );

    return {
      ok: true,
      message: input.is_subtema_zero
        ? `Tema 0 "${input.title.trim()}" (Introducción) creado al inicio del curso.`
        : `Tema "${input.title.trim()}" creado exitosamente. Ya puedes meterle videos de Bunny.`,
      moduleId: newModuleId,
    };
  };

  const toggleModuleSubtemaZero = (courseId: string, moduleId: string) => {
    let wasTurnedOn = false;
    let modTitle = '';

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const target = c.modules.find((m) => m.id === moduleId);
        if (!target) return c;

        wasTurnedOn = !target.is_subtema_zero;
        modTitle = target.title;

        const updated = c.modules.map((m) => {
          if (m.id === moduleId) {
            return { ...m, is_subtema_zero: wasTurnedOn };
          }
          // Solo un Tema 0 por curso
          return wasTurnedOn ? { ...m, is_subtema_zero: false } : m;
        });

        // Si se activa como Tema 0, lo subimos al primer lugar del curso automáticamente
        if (wasTurnedOn) {
          const zeroMod = updated.find((m) => m.id === moduleId);
          const rest = updated.filter((m) => m.id !== moduleId);
          return {
            ...c,
            modules: zeroMod ? [zeroMod, ...rest] : updated,
          };
        }

        return { ...c, modules: updated };
      })
    );

    return {
      ok: true,
      message: wasTurnedOn
        ? `El tema "${modTitle}" quedó marcado como Tema 0 (Introducción) al inicio del curso.`
        : `El tema "${modTitle}" volvió a la numeración normal (Tema 1, 2...).`,
    };
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
              compareLessonTitles(a.title, b.title)
            );
            return { ...m, lessons: sorted };
          }),
        };
      })
    );
    return {
      ok: true,
      message: 'Videos del tema ordenados en orden numérico y alfabético (0-9 / A-Z).',
    };
  };

  const renameModuleInCourse = (courseId: string, moduleId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      return { ok: false, message: 'El nombre del Tema no puede estar vacío.' };
    }
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
    return {
      ok: true,
      message: `Tema renombrado a "${newTitle.trim()}".`,
    };
  };

  const reorderModuleInCourse = (
    courseId: string,
    moduleId: string,
    direction: 'up' | 'down'
  ) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const idx = c.modules.findIndex((m) => m.id === moduleId);
        if (idx === -1) return c;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= c.modules.length) return c;
        const copy = [...c.modules];
        const [moved] = copy.splice(idx, 1);
        copy.splice(targetIdx, 0, moved);
        return { ...c, modules: copy };
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
    if (!input.title.trim()) {
      return { ok: false, message: 'El título de la clase es obligatorio.' };
    }

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      module_id: input.module_id,
      course_id: input.course_id,
      title: input.title.trim(),
      description: input.description.trim() || 'Clase práctica paso a paso.',
      video_provider: input.video_provider,
      video_id: input.video_id.trim() || 'video-id',
      video_embed_url:
        input.video_embed_url.trim() ||
        `https://iframe.mediadelivery.net/embed/808934/${input.video_id.trim()}?autoplay=false&preload=true&responsive=true`,
      duration_minutes: Number(input.duration_minutes) || 3,
      resource_url: '/recursos/material-complementario.pdf',
      is_free_preview: false,
      sort_order: 99,
    };

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== input.course_id) return c;
        return {
          ...c,
          modules: c.modules.map((m) =>
            m.id === input.module_id
              ? { ...m, lessons: [...m.lessons, newLesson] }
              : m
          ),
        };
      })
    );

    return {
      ok: true,
      message: `Clase "${newLesson.title}" agregada exitosamente al Tema.`,
    };
  };

  const renameLessonInCourse = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    newTitle: string
  ) => {
    if (!newTitle.trim()) {
      return { ok: false, message: 'El nombre de la clase no puede estar vacío.' };
    }
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          modules: c.modules.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  lessons: m.lessons.map((l) =>
                    l.id === lessonId ? { ...l, title: newTitle.trim() } : l
                  ),
                }
              : m
          ),
        };
      })
    );
    return {
      ok: true,
      message: `Clase renombrada a "${newTitle.trim()}".`,
    };
  };

  // Mover un video/clase de un Tema a otro con 1 clic
  const moveLessonToModule = (
    courseId: string,
    lessonId: string,
    targetModuleId: string
  ) => {
    let movedTitle = '';
    let destTitle = '';

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        let foundLesson: Lesson | null = null;

        for (const m of c.modules) {
          const hit = m.lessons.find((l) => l.id === lessonId);
          if (hit) {
            foundLesson = { ...hit, module_id: targetModuleId };
            movedTitle = hit.title;
            break;
          }
        }

        if (!foundLesson) return c;

        const targetMod = c.modules.find((m) => m.id === targetModuleId);
        if (targetMod) destTitle = targetMod.title;

        return {
          ...c,
          modules: c.modules.map((m) => {
            const withoutLesson = m.lessons.filter((l) => l.id !== lessonId);
            if (m.id === targetModuleId && foundLesson) {
              return {
                ...m,
                lessons: [...withoutLesson, foundLesson],
              };
            }
            return {
              ...m,
              lessons: withoutLesson,
            };
          }),
        };
      })
    );

    return {
      ok: true,
      message: `Video "${movedTitle}" movido al Tema "${destTitle}".`,
    };
  };

  const reorderLessonInModule = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    direction: 'up' | 'down'
  ) => {
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
            const [moved] = copy.splice(idx, 1);
            copy.splice(targetIdx, 0, moved);
            return { ...m, lessons: copy };
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

  const toggleLessonCompleted = (lessonId: string) => {
    setCompletedLessonIds((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const triggerSimulatedWebhook = (
    provider: 'stripe' | 'mercadopago',
    tenantId: string,
    licensesToAdd: number
  ) => {
    const targetTenant = tenants.find((t) => t.id === tenantId);
    if (!targetTenant) return;

    const updatedMax = targetTenant.max_licenses + licensesToAdd;
    updateTenantLicenseLimit(
      tenantId,
      updatedMax,
      `Pack Reseller ${updatedMax} Alumnos (${provider === 'stripe' ? 'Stripe' : 'Mercado Pago'})`
    );

    const newLog: SubscriptionWebhookLog = {
      id: `wh-${Date.now()}`,
      provider,
      external_event_id:
        provider === 'stripe'
          ? `evt_${Math.random().toString(36).substring(2, 12)}`
          : `mp_pay_${Math.floor(100000000 + Math.random() * 900000000)}`,
      event_type:
        provider === 'stripe'
          ? 'checkout.session.completed'
          : 'subscription_preapproval.updated',
      tenant_id: tenantId,
      summary: `${targetTenant.name} amplió +${licensesToAdd} licencias vía webhook (${updatedMax} totales)`,
      processed_at: new Date().toISOString(),
    };

    setWebhookLogs((prev) => [newLog, ...prev]);
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.TENANTS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.COURSES);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TENANT_ID);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.COMPLETED_LESSONS);
    localStorage.removeItem(STORAGE_KEYS.WEBHOOK_LOGS);
    localStorage.removeItem(STORAGE_KEYS.LOCAL_SESSION_TOKEN);
    setTenants(INITIAL_TENANTS);
    setUsers(INITIAL_USERS);
    setCourses(INITIAL_COURSES);
    setWebhookLogs(INITIAL_WEBHOOK_LOGS);
    setCurrentTenantId(INITIAL_TENANTS[1].id);
    setCurrentUserId(INITIAL_USERS[2].id);
    setLocalSessionToken('sess-st-laura-991');
  };

  return (
    <LMSContext.Provider
      value={{
        isSupabaseLive,
        tenants,
        currentTenant,
        users,
        currentUser,
        courses,
        tenantCourses,
        webhookLogs,
        completedLessonIds,
        localSessionToken,
        isSessionDisplaced,
        displacedByDevice,
        selectTenantById,
        selectTenantBySlug,
        createTenant,
        updateTenantBranding,
        updateTenantLicenseLimit,
        toggleCourseForTenant,
        loginAsRole,
        loginWithCredentials,
        logout,
        createStudent,
        toggleStudentActiveStatus,
        simulateConcurrentLoginFromOtherDevice,
        reclaimCurrentDeviceSession,
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
        toggleLessonCompleted,
        triggerSimulatedWebhook,
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
    throw new Error('useLMS debe usarse dentro de un LMSProvider');
  }
  return context;
}
