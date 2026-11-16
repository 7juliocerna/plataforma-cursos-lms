-- ============================================================================
-- ESQUEMA SQL COMPLETO: PLATAFORMA LMS MARCA BLANCA & MULTITENANT (SaaS B2B)
-- Base de datos: Supabase (PostgreSQL + Auth + Row Level Security)
-- ============================================================================
-- INSTRUCCIONES RÁPIDAS:
-- 1. Abre tu proyecto en https://supabase.com/dashboard
-- 2. En el menú izquierdo, haz clic en "SQL Editor" -> "+ New query"
-- 3. Pega TODO este archivo y haz clic en el botón verde "Run" (abajo a la derecha).
-- ============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS (Tipos de datos personalizados)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('superadmin', 'reseller_admin', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.video_provider_type AS ENUM ('bunny', 'cloudflare', 'vimeo', 'youtube', 'custom_embed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.plan_status_type AS ENUM ('active', 'trialing', 'past_due', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABLA: tenants (Academias / Resellers Marca Blanca)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,               -- Subdominio ej: "academia-pro" -> academia-pro.tudominio.com
    custom_domain TEXT UNIQUE,               -- Dominio propio opcional ej: "cursos.miempresa.com"
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#4F46E5',
    secondary_color TEXT NOT NULL DEFAULT '#0F172A',
    accent_color TEXT NOT NULL DEFAULT '#10B981',
    tagline TEXT DEFAULT 'Impulsa tu carrera con formación práctica de alto impacto',
    support_email TEXT,
    plan_name TEXT NOT NULL DEFAULT 'Plan Reseller Pro',
    plan_status public.plan_status_type NOT NULL DEFAULT 'active',
    max_licenses INTEGER NOT NULL DEFAULT 25 CHECK (max_licenses >= 0),
    used_licenses INTEGER NOT NULL DEFAULT 0 CHECK (used_licenses >= 0),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    mercadopago_preapproval_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain);

-- ============================================================================
-- 3. TABLA: profiles (Usuarios vinculados a auth.users y a su Academia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    role public.user_role NOT NULL DEFAULT 'student',
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true, -- Si es student y está true, consume 1 licencia del tenant
    -- Control Anti-Compartir Cuenta (Sesión Única por Alumno)
    active_session_id TEXT,
    active_session_device TEXT,
    last_session_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================================
-- 4. TABLA: courses (Catálogo Maestro de Cursos Pregrabados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL, -- NULL = Curso Global del SuperAdmin
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT,
    description TEXT,
    thumbnail_url TEXT,
    category TEXT DEFAULT 'Negocios & Tecnología',
    level TEXT DEFAULT 'Intermedio',
    duration_label TEXT DEFAULT '8h 30m',
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLA: tenant_courses (Cursos asignados/habilitados para cada Reseller)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_courses_tenant ON public.tenant_courses(tenant_id);

-- ============================================================================
-- 6. TABLA: modules (Módulos dentro de cada Curso)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id, sort_order);

-- ============================================================================
-- 7. TABLA: lessons (Clases en Video con Bunny.net / Cloudflare Stream)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_provider public.video_provider_type NOT NULL DEFAULT 'bunny',
    video_id TEXT,                           -- ID del video en Bunny.net o Cloudflare Stream
    video_embed_url TEXT NOT NULL,           -- URL de inserción del reproductor externo
    duration_minutes INTEGER NOT NULL DEFAULT 12,
    resource_url TEXT,                       -- PDF o material descargable opcional
    is_free_preview BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id);

-- ============================================================================
-- 8. TABLA: enrollments (Inscripciones de Alumnos a Cursos de su Academia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE (student_id, course_id)
);

-- ============================================================================
-- 9. TABLA: lesson_progress (Progreso clase por clase del Alumno)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT true,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, lesson_id)
);

-- ============================================================================
-- 10. TABLA: subscription_events (Auditoría de Webhooks Stripe / Mercado Pago)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'mercadopago')),
    external_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. CONTROL ESTRICTO DE LICENCIAS (Triggers en PostgreSQL)
-- Impide que un Reseller active más alumnos de los que compró en max_licenses
-- y sincroniza automáticamente el contador used_licenses.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enforce_tenant_license_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_max_licenses INTEGER;
    v_current_active INTEGER;
BEGIN
    -- Solo aplica a usuarios con rol 'student' que estén activos y pertenezcan a un tenant
    IF NEW.role = 'student' AND NEW.is_active = true AND NEW.tenant_id IS NOT NULL THEN
        -- Si es un INSERT nuevo o si pasa de inactivo a activo, o cambia de tenant
        IF (TG_OP = 'INSERT') OR
           (TG_OP = 'UPDATE' AND (OLD.is_active = false OR OLD.tenant_id IS DISTINCT FROM NEW.tenant_id OR OLD.role <> 'student')) THEN

            SELECT max_licenses INTO v_max_licenses
            FROM public.tenants
            WHERE id = NEW.tenant_id
            FOR UPDATE;

            SELECT COUNT(*) INTO v_current_active
            FROM public.profiles
            WHERE tenant_id = NEW.tenant_id
              AND role = 'student'
              AND is_active = true
              AND id <> NEW.id;

            IF v_current_active >= v_max_licenses THEN
                RAISE EXCEPTION 'LIMITE_LICENCIAS_ALCANZADO: Esta academia ha alcanzado su límite máximo de % licencias activas. Amplía tu paquete o desactiva un alumno para liberar cupo.', v_max_licenses;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_tenant_license_limit ON public.profiles;
CREATE TRIGGER trg_enforce_tenant_license_limit
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_tenant_license_limit();

-- Función que recalcula exactamente used_licenses después de insertar/actualizar/borrar un alumno
CREATE OR REPLACE FUNCTION public.sync_tenant_used_licenses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.tenant_id IS NOT NULL THEN
            UPDATE public.tenants
            SET used_licenses = (
                SELECT COUNT(*)
                FROM public.profiles
                WHERE tenant_id = NEW.tenant_id
                  AND role = 'student'
                  AND is_active = true
            ),
            updated_at = NOW()
            WHERE id = NEW.tenant_id;
        END IF;
    END IF;

    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        IF OLD.tenant_id IS NOT NULL AND (TG_OP = 'DELETE' OR OLD.tenant_id IS DISTINCT FROM NEW.tenant_id) THEN
            UPDATE public.tenants
            SET used_licenses = (
                SELECT COUNT(*)
                FROM public.profiles
                WHERE tenant_id = OLD.tenant_id
                  AND role = 'student'
                  AND is_active = true
            ),
            updated_at = NOW()
            WHERE id = OLD.tenant_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tenant_used_licenses ON public.profiles;
CREATE TRIGGER trg_sync_tenant_used_licenses
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_tenant_used_licenses();

-- ============================================================================
-- 12. FUNCIONES ANTI-COMPARTIR CUENTA (Sesión Única por Alumno)
-- ============================================================================
-- Registra un nuevo token de sesión al iniciar sesión, invalidando cualquier dispositivo previo
CREATE OR REPLACE FUNCTION public.register_student_session(
    p_session_id TEXT,
    p_device_info TEXT DEFAULT 'Navegador Web'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_previous_session TEXT;
BEGIN
    SELECT active_session_id INTO v_previous_session
    FROM public.profiles
    WHERE id = auth.uid();

    UPDATE public.profiles
    SET active_session_id = p_session_id,
        active_session_device = p_device_info,
        last_session_at = NOW(),
        updated_at = NOW()
    WHERE id = auth.uid();

    RETURN jsonb_build_object(
        'success', true,
        'active_session_id', p_session_id,
        ' displaced_previous_session', (v_previous_session IS NOT NULL AND v_previous_session <> p_session_id)
    );
END;
$$;

-- Verifica si la sesión del dispositivo actual sigue siendo la única sesión válida
CREATE OR REPLACE FUNCTION public.verify_student_session(
    p_session_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile RECORD;
BEGIN
    SELECT id, is_active, active_session_id, active_session_device, last_session_at
    INTO v_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'PROFILE_NOT_FOUND');
    END IF;

    IF v_profile.is_active = false THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'LICENSE_DEACTIVATED');
    END IF;

    IF v_profile.active_session_id IS NOT NULL AND v_profile.active_session_id <> p_session_id THEN
        RETURN jsonb_build_object(
            'valid', false,
            'reason', 'CONCURRENT_SESSION_DETECTED',
            'active_device', v_profile.active_session_device
        );
    END IF;

    RETURN jsonb_build_object('valid', true);
END;
$$;

-- ============================================================================
-- 13. FUNCIONES AUXILIARES PARA ROW LEVEL SECURITY (RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- 14. POLÍTICAS ROW LEVEL SECURITY (Aislamiento Multitenant Estricto)
-- ============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Políticas para TENANTS:
-- Cualquiera puede leer la configuración visual básica de una academia activa (para renderizar Landing y Login Marca Blanca)
DROP POLICY IF EXISTS "Lectura publica de tenants activos para Marca Blanca" ON public.tenants;
CREATE POLICY "Lectura publica de tenants activos para Marca Blanca"
ON public.tenants FOR SELECT
USING (is_active = true OR public.current_user_role() = 'superadmin');

-- SuperAdmin puede crear/editar/borrar cualquier tenant; Reseller Admin solo puede actualizar su propia academia (colores, logo, nombre)
DROP POLICY IF EXISTS "SuperAdmin gestiona todos los tenants" ON public.tenants;
CREATE POLICY "SuperAdmin gestiona todos los tenants"
ON public.tenants FOR ALL
USING (public.current_user_role() = 'superadmin')
WITH CHECK (public.current_user_role() = 'superadmin');

DROP POLICY IF EXISTS "Reseller actualiza su propio tenant" ON public.tenants;
CREATE POLICY "Reseller actualiza su propio tenant"
ON public.tenants FOR UPDATE
USING (id = public.current_user_tenant_id() AND public.current_user_role() = 'reseller_admin')
WITH CHECK (id = public.current_user_tenant_id() AND public.current_user_role() = 'reseller_admin');

-- Políticas para PROFILES:
DROP POLICY IF EXISTS "Usuarios ven perfiles de su propio tenant o SuperAdmin ve todos" ON public.profiles;
CREATE POLICY "Usuarios ven perfiles de su propio tenant o SuperAdmin ve todos"
ON public.profiles FOR SELECT
USING (
    id = auth.uid()
    OR public.current_user_role() = 'superadmin'
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'reseller_admin')
);

DROP POLICY IF EXISTS "Reseller gestiona alumnos de su academia y SuperAdmin todos" ON public.profiles;
CREATE POLICY "Reseller gestiona alumnos de su academia y SuperAdmin todos"
ON public.profiles FOR ALL
USING (
    public.current_user_role() = 'superadmin'
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'reseller_admin')
    OR id = auth.uid()
)
WITH CHECK (
    public.current_user_role() = 'superadmin'
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'reseller_admin')
    OR id = auth.uid()
);

-- Políticas para COURSES y TENANT_COURSES:
DROP POLICY IF EXISTS "Lectura de asignaciones de cursos por academia" ON public.tenant_courses;
CREATE POLICY "Lectura de asignaciones de cursos por academia"
ON public.tenant_courses FOR SELECT
USING (true);

DROP POLICY IF EXISTS "SuperAdmin gestiona asignaciones de cursos" ON public.tenant_courses;
CREATE POLICY "SuperAdmin gestiona asignaciones de cursos"
ON public.tenant_courses FOR ALL
USING (public.current_user_role() = 'superadmin')
WITH CHECK (public.current_user_role() = 'superadmin');

DROP POLICY IF EXISTS "Lectura de cursos publicados" ON public.courses;
CREATE POLICY "Lectura de cursos publicados"
ON public.courses FOR SELECT
USING (is_published = true OR public.current_user_role() = 'superadmin');

DROP POLICY IF EXISTS "SuperAdmin gestiona catalogo de cursos" ON public.courses;
CREATE POLICY "SuperAdmin gestiona catalogo de cursos"
ON public.courses FOR ALL
USING (public.current_user_role() = 'superadmin')
WITH CHECK (public.current_user_role() = 'superadmin');

-- Políticas para MODULES y LESSONS:
DROP POLICY IF EXISTS "Lectura de modulos" ON public.modules;
CREATE POLICY "Lectura de modulos"
ON public.modules FOR SELECT
USING (true);

DROP POLICY IF EXISTS "SuperAdmin gestiona modulos" ON public.modules;
CREATE POLICY "SuperAdmin gestiona modulos"
ON public.modules FOR ALL
USING (public.current_user_role() = 'superadmin')
WITH CHECK (public.current_user_role() = 'superadmin');

DROP POLICY IF EXISTS "Alumnos activos ven clases de los cursos de su academia" ON public.lessons;
CREATE POLICY "Alumnos activos ven clases de los cursos de su academia"
ON public.lessons FOR SELECT
USING (
    is_free_preview = true
    OR public.current_user_role() = 'superadmin'
    OR EXISTS (
        SELECT 1 FROM public.tenant_courses tc
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE tc.course_id = lessons.course_id
          AND tc.tenant_id = p.tenant_id
          AND p.is_active = true
    )
);

DROP POLICY IF EXISTS "SuperAdmin gestiona clases" ON public.lessons;
CREATE POLICY "SuperAdmin gestiona clases"
ON public.lessons FOR ALL
USING (public.current_user_role() = 'superadmin')
WITH CHECK (public.current_user_role() = 'superadmin');

-- Políticas para ENROLLMENTS y LESSON_PROGRESS:
DROP POLICY IF EXISTS "Aislamiento de progreso por alumno y academia" ON public.lesson_progress;
CREATE POLICY "Aislamiento de progreso por alumno y academia"
ON public.lesson_progress FOR ALL
USING (
    student_id = auth.uid()
    OR public.current_user_role() = 'superadmin'
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'reseller_admin')
)
WITH CHECK (
    student_id = auth.uid()
    OR public.current_user_role() = 'superadmin'
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'reseller_admin')
);

DROP POLICY IF EXISTS "Aislamiento de matriculas por alumno y academia" ON public.enrollments;
CREATE POLICY "Aislamiento de matriculas por alumno y academia"
ON public.enrollments FOR ALL
USING (
    student_id = auth.uid()
    OR public.current_user_role() = 'superadmin'
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'reseller_admin')
)
WITH CHECK (
    student_id = auth.uid()
    OR public.current_user_role() = 'superadmin'
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'reseller_admin')
);

-- ============================================================================
-- 15. DATOS SEMILLA INICIALES (Academias de Ejemplo, Cursos y Clases)
-- ============================================================================
INSERT INTO public.tenants (id, name, slug, custom_domain, logo_url, primary_color, secondary_color, accent_color, tagline, support_email, plan_name, max_licenses, used_licenses)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Academia Matriz (Directa)', 'matriz', 'cursos.miacademiamatriz.com', NULL, '#4F46E5', '#0F172A', '#10B981', 'Domina habilidades digitales de alta rentabilidad con mentoría paso a paso', 'soporte@miacademiamatriz.com', 'Plan Matriz Ilimitado', 500, 3),
    ('22222222-2222-2222-2222-222222222222', 'Impulso Digital Academy', 'impulso-digital', 'aula.impulsodigital.co', NULL, '#E11D48', '#18181B', '#F59E0B', 'La escuela privada para agencias de marketing, tráfico de pago y cierres B2B', 'hola@impulsodigital.co', 'Pack Reseller 25 Alumnos', 25, 24),
    ('33333333-3333-3333-3333-333333333333', 'Finanzas & Capital Club', 'finanzas-club', 'campus.finanzasclub.mx', NULL, '#059669', '#064E3B', '#38BDF8', 'Educación financiera corporativa, inversión patrimonial y gestión de portafolios', 'campus@finanzasclub.mx', 'Pack Reseller 100 Alumnos', 100, 42)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.courses (id, title, slug, subtitle, description, category, level, duration_label, is_published)
VALUES
    ('aaaa1111-1111-1111-1111-111111111111', 'Arquitectura de Ventas High-Ticket & Embudos B2B', 'ventas-high-ticket-b2b', 'Sistema completo para captar, cualificar y cerrar clientes corporativos de alto valor.', 'Aprende desde cero cómo estructurar ofertas irresistibles, automatizar tu prospección y dirigir llamadas de venta con tasas de cierre superiores al 35%.', 'Ventas & Negocios', 'Avanzado', '11h 40m', true),
    ('bbbb2222-2222-2222-2222-222222222222', 'Automatización con IA Generativa para Empresas', 'automatizacion-ia-empresas', 'Implementa agentes de IA, flujos con n8n/Make y copilotos internos sin saber programar.', 'Domina las herramientas prácticas de Inteligencia Artificial para ahorrar más de 15 horas semanales en operaciones, atención al cliente y generación de contenido.', 'Inteligencia Artificial', 'Intermedio', '9h 15m', true),
    ('cccc3333-3333-3333-3333-333333333333', 'Lanzamiento de Infoproductos & Membresías Recurrentes', 'lanzamiento-membresias-recurrentes', 'Cómo empaquetar tu conocimiento y escalar ingresos predecibles mes a mes.', 'El método probado para diseñar, grabar, fijar precios y retener alumnos en un ecosistema de membresías y distribución por resellers.', 'E-Learning & SaaS', 'Inicial - Intermedio', '7h 50m', true)
ON CONFLICT (slug) DO NOTHING;

-- Asignar cursos a las academias
INSERT INTO public.tenant_courses (tenant_id, course_id, is_featured)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', true),
    ('11111111-1111-1111-1111-111111111111', 'bbbb2222-2222-2222-2222-222222222222', true),
    ('11111111-1111-1111-1111-111111111111', 'cccc3333-3333-3333-3333-333333333333', false),
    ('22222222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', true),
    ('22222222-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222', false),
    ('33333333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111', true),
    ('33333333-3333-3333-3333-333333333333', 'cccc3333-3333-3333-3333-333333333333', true)
ON CONFLICT (tenant_id, course_id) DO NOTHING;

-- Módulos y Lecciones iniciales
INSERT INTO public.modules (id, course_id, title, description, sort_order)
VALUES
    ('dddd1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'Módulo 1: Fundamentos de la Oferta B2B Irresistible', 'Diseño de propuesta de valor, pricing y garantías.', 1),
    ('dddd2222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'Módulo 2: Prospección Multicanal & Embudos VSL', 'Captación predecible de leads cualificados.', 2),
    ('dddd3333-3333-3333-3333-333333333333', 'bbbb2222-2222-2222-2222-222222222222', 'Módulo 1: Arquitectura de Agentes y Flujos sin Código', 'Conectando LLMs con tus herramientas de negocio.', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons (id, module_id, course_id, title, description, video_provider, video_id, video_embed_url, duration_minutes, resource_url, is_free_preview, sort_order)
VALUES
    ('eeee1111-1111-1111-1111-111111111111', 'dddd1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '1.1. Qué son los modos de fusión', 'Introducción clara y visual al funcionamiento de los modos de fusión.', 'bunny', 'dcc4f092-d518-4cb3-a79f-a969c6f3ea9a', 'https://iframe.mediadelivery.net/embed/808934/dcc4f092-d518-4cb3-a79f-a969c6f3ea9a?autoplay=false&loop=false&muted=false&preload=true&responsive=true', 2, '/recursos/guia-modos-de-fusion.pdf', true, 1),
    ('eeee2222-2222-2222-2222-222222222222', 'dddd1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '1.2. Usos para los modos de fusión', 'Casos prácticos y ejemplos reales de aplicación de los modos de fusión.', 'bunny', '25a1ca78-6a1d-42cc-88da-af20ec9957be', 'https://iframe.mediadelivery.net/embed/808934/25a1ca78-6a1d-42cc-88da-af20ec9957be?autoplay=false&loop=false&muted=false&preload=true&responsive=true', 2, '/recursos/ejemplos-usos-modos-fusion.pdf', false, 2),
    ('eeee3333-3333-3333-3333-333333333333', 'dddd2222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', '1.3. Ventajas del uso de los modos de fusión en acciones', 'Cómo combinar modos de fusión dentro de acciones automatizadas.', 'bunny', '063b32ac-b377-436c-9df3-54021b452a6f', 'https://iframe.mediadelivery.net/embed/808934/063b32ac-b377-436c-9df3-54021b452a6f?autoplay=false&loop=false&muted=false&preload=true&responsive=true', 4, '/recursos/pack-acciones-modos-fusion.pdf', false, 3),
    ('eeee4444-4444-4444-4444-444444444444', 'dddd3333-3333-3333-3333-333333333333', 'bbbb2222-2222-2222-2222-222222222222', '1. Tu primer Copiloto de Atención y Cualificación 24/7', 'Configuración paso a paso de un asistente entrenado con los documentos de tu empresa.', 'cloudflare', 'cf-stream-101', 'https://customer-demo.cloudflarestream.com/cf-stream-101/iframe', 21, '/recursos/prompts-copiloto.pdf', true, 1)
ON CONFLICT (id) DO NOTHING;
