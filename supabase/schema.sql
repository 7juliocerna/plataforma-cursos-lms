-- ============================================================================
-- ESQUEMA SQL: PLATAFORMA MULTI-ACADEMIA (UN SOLO DUEÑO Y VENDEDOR)
-- Base de datos: Supabase (PostgreSQL + Auth + Row Level Security + Triggers)
-- Modelo: Multi-Academia bajo una sola marca (Excel, Diseño, Marketing, etc.)
-- Roles: admin (Dueño de la plataforma) y student (Alumnos finales)
-- ============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS Y EXTENSIONES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.video_provider_type AS ENUM ('bunny', 'cloudflare', 'vimeo', 'youtube', 'custom_embed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABLA: academies (Academias / Escuelas temáticas propias de la plataforma)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,                                -- Ej: "Academia de Excel & Productividad"
    slug TEXT NOT NULL UNIQUE,                          -- Ej: "excel"
    description TEXT,
    icon_name TEXT NOT NULL DEFAULT 'GraduationCap',    -- Icono distintivo
    primary_color TEXT NOT NULL DEFAULT '#10B981',      -- Color temático de la academia
    secondary_color TEXT NOT NULL DEFAULT '#064E3B',
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 19.00,
    price_annual NUMERIC(10, 2) NOT NULL DEFAULT 149.00,
    sort_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academies_slug ON public.academies(slug);

-- ============================================================================
-- 3. TABLA: profiles (Usuarios vinculados a Supabase Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    
    -- Membresía All-Access (Pase Total a todas las academias)
    is_all_access BOOLEAN NOT NULL DEFAULT false,
    all_access_end_date TIMESTAMPTZ,
    
    -- Control Anti-Compartir Cuenta (Sesión Única por Alumno)
    active_session_id TEXT,
    active_session_device TEXT,
    last_session_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Normalización en caso de que public.profiles ya existiera previamente con enum user_role
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
        ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::text;
        EXECUTE 'UPDATE public.profiles SET role = ''admin'' WHERE role IN (''superadmin'', ''reseller_admin'', ''reseller'', ''owner'')';
        ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'student';
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'student'));
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_profiles_all_access ON public.profiles(is_all_access, all_access_end_date);

-- ============================================================================
-- 4. TABLA: academy_subscriptions (Suscripciones por Academia o Pase Total)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.academy_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE, -- NULL si es Pase Total
    is_all_access BOOLEAN NOT NULL DEFAULT false,
    plan_name TEXT NOT NULL,                             -- Ej: "Acceso Academia Excel (Anual)", "Membresía All-Access"
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_student ON public.academy_subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_academy ON public.academy_subscriptions(academy_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.academy_subscriptions(end_date);

-- ============================================================================
-- 5. TABLA: courses (Cursos organizados dentro de cada Academia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT,
    description TEXT,
    thumbnail_url TEXT,
    category TEXT DEFAULT 'Productividad',
    level TEXT DEFAULT 'Todos los niveles',
    duration_label TEXT DEFAULT '6h 30m',
    sort_order INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_academy ON public.courses(academy_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);

-- ============================================================================
-- 6. TABLA: modules (Módulos / Temarios de cada Curso)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_subtema_zero BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id, sort_order);

-- ============================================================================
-- 7. TABLA: lessons (Clases en Video con Bunny.net Stream)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_provider public.video_provider_type NOT NULL DEFAULT 'bunny',
    video_id TEXT,
    video_embed_url TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 10,
    resource_url TEXT,
    is_free_preview BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id);

-- ============================================================================
-- 8. TABLA: lesson_progress (Progreso clase por clase del Alumno)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT true,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lookup ON public.lesson_progress(student_id, course_id);

-- ============================================================================
-- 9. TABLA: global_payment_settings (Única Configuración Global de Cobros)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.global_payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mercadopago_public_key TEXT,
    mercadopago_access_token TEXT,
    mercadopago_webhook_secret TEXT,
    -- Pagos Manuales / Inmediatos
    yape_phone TEXT DEFAULT '987654321',
    yape_qr_url TEXT,
    plin_phone TEXT DEFAULT '987654321',
    bank_transfer_info TEXT DEFAULT 'BCP Soles: 191-00000000-0-00 / CCI: 00219100000000000000',
    currency TEXT NOT NULL DEFAULT 'USD',
    all_access_price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 29.00,
    all_access_price_annual NUMERIC(10, 2) NOT NULL DEFAULT 240.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. TABLA: student_payments (Historial de Pagos Recibidos por el Admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
    is_all_access BOOLEAN NOT NULL DEFAULT false,
    plan_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL DEFAULT 'Mercado Pago', -- 'Mercado Pago', 'Yape', 'Plin', 'Transferencia'
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'rejected')),
    invoice_number TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_payments_student ON public.student_payments(student_id, created_at DESC);

-- ============================================================================
-- 11. TRIGGER AUTOMÁTICO: Crear Perfil al Registrarse con Supabase Auth
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_email TEXT := 'ceo@plataformalms.com'; -- Correo del dueño único
    v_role public.app_role := 'student';
BEGIN
    -- Si el email coincide con el dueño, asignarle rol admin
    IF LOWER(NEW.email) = LOWER(v_admin_email) THEN
        v_role := 'admin';
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        is_all_access,
        all_access_end_date
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        v_role,
        CASE WHEN v_role = 'admin' THEN true ELSE false END,
        CASE WHEN v_role = 'admin' THEN (NOW() + INTERVAL '10 years') ELSE NULL END
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 12. FUNCIÓN RPC: Validar si un Alumno tiene Acceso a un Curso / Academia
-- Devuelve true si es admin, o si tiene Pase Total activo, o si tiene suscripción vigente a esa academia
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_academy_access(p_student_id UUID, p_academy_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role public.app_role;
    v_all_access BOOLEAN;
    v_all_access_end TIMESTAMPTZ;
    v_has_active_sub BOOLEAN;
BEGIN
    SELECT role, is_all_access, all_access_end_date
    INTO v_role, v_all_access, v_all_access_end
    FROM public.profiles
    WHERE id = p_student_id;

    -- Si es admin, tiene acceso total
    IF v_role = 'admin' THEN
        RETURN true;
    END IF;

    -- Si tiene Pase Total activo
    IF v_all_access = true AND (v_all_access_end IS NULL OR v_all_access_end >= NOW()) THEN
        RETURN true;
    END IF;

    -- Si tiene suscripción específica a esta academia
    SELECT EXISTS (
        SELECT 1
        FROM public.academy_subscriptions
        WHERE student_id = p_student_id
          AND academy_id = p_academy_id
          AND status = 'active'
          AND end_date >= NOW()
    ) INTO v_has_active_sub;

    RETURN v_has_active_sub;
END;
$$;

-- ============================================================================
-- 13. FUNCIONES RPC: Sesión Única Anti-Compartir Cuenta
-- ============================================================================
CREATE OR REPLACE FUNCTION public.register_student_session(
    p_student_id UUID,
    p_device_info TEXT,
    p_session_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET active_session_id = p_session_token,
        active_session_device = p_device_info,
        last_session_at = NOW(),
        updated_at = NOW()
    WHERE id = p_student_id;

    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_student_session(
    p_student_id UUID,
    p_session_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_active_token TEXT;
BEGIN
    SELECT active_session_id INTO v_active_token
    FROM public.profiles
    WHERE id = p_student_id;

    IF v_active_token IS NULL OR v_active_token = p_session_token THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- ============================================================================
-- 14. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;

-- Helper: ¿Es el usuario actual administrador?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role::text = 'admin'
    );
$$;

-- Academias: Públicas para lectura; solo admin puede editar
DROP POLICY IF EXISTS "Academias públicas para ver" ON public.academies;
CREATE POLICY "Academias públicas para ver" ON public.academies
FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin administra academias" ON public.academies;
CREATE POLICY "Admin administra academias" ON public.academies
FOR ALL USING (public.is_admin());

-- Perfiles: Cada usuario puede ver y editar su propio perfil; admin ve todos
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios ven su propio perfil" ON public.profiles
FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios actualizan su propio perfil" ON public.profiles
FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- Cursos, Módulos y Lecciones: Visibles si están publicados
DROP POLICY IF EXISTS "Cursos visibles" ON public.courses;
CREATE POLICY "Cursos visibles" ON public.courses
FOR SELECT USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin gestiona cursos" ON public.courses;
CREATE POLICY "Admin gestiona cursos" ON public.courses
FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Modulos visibles" ON public.modules;
CREATE POLICY "Modulos visibles" ON public.modules
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin gestiona modulos" ON public.modules;
CREATE POLICY "Admin gestiona modulos" ON public.modules
FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Lecciones visibles" ON public.lessons;
CREATE POLICY "Lecciones visibles" ON public.lessons
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin gestiona lecciones" ON public.lessons;
CREATE POLICY "Admin gestiona lecciones" ON public.lessons
FOR ALL USING (public.is_admin());

-- Progreso de clases: Alumno gestiona su propio progreso; admin puede consultar
DROP POLICY IF EXISTS "Alumnos gestionan su propio progreso" ON public.lesson_progress;
CREATE POLICY "Alumnos gestionan su propio progreso" ON public.lesson_progress
FOR ALL USING (student_id = auth.uid() OR public.is_admin())
WITH CHECK (student_id = auth.uid() OR public.is_admin());

-- Suscripciones: Alumnos ven sus suscripciones; admin gestiona todas
DROP POLICY IF EXISTS "Alumnos ven sus suscripciones" ON public.academy_subscriptions;
CREATE POLICY "Alumnos ven sus suscripciones" ON public.academy_subscriptions
FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admin gestiona suscripciones" ON public.academy_subscriptions;
CREATE POLICY "Admin gestiona suscripciones" ON public.academy_subscriptions
FOR ALL USING (public.is_admin());

-- Configuración de Pagos: Solo visible y editable por el Admin
DROP POLICY IF EXISTS "Solo admin gestiona pagos" ON public.global_payment_settings;
CREATE POLICY "Solo admin gestiona pagos" ON public.global_payment_settings
FOR ALL USING (public.is_admin());

-- Pagos de Alumnos: Alumnos ven sus recibos; admin ve todos
DROP POLICY IF EXISTS "Alumnos ven sus recibos" ON public.student_payments;
CREATE POLICY "Alumnos ven sus recibos" ON public.student_payments
FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admin gestiona pagos de alumnos" ON public.student_payments;
CREATE POLICY "Admin gestiona pagos de alumnos" ON public.student_payments
FOR ALL USING (public.is_admin());

-- ============================================================================
-- 15. DATOS SEMILLA (Seed inicial de Academias temáticas y configuración)
-- ============================================================================
INSERT INTO public.global_payment_settings (
    currency,
    all_access_price_monthly,
    all_access_price_annual,
    yape_phone,
    plin_phone,
    bank_transfer_info
) VALUES (
    'USD',
    29.00,
    240.00,
    '987 654 321',
    '987 654 321',
    'BCP Soles: 191-88492019-0-44 (CCI: 0021910088492019044) — Titular: Julio Cerna'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.academies (id, title, slug, description, icon_name, primary_color, secondary_color, price_monthly, price_annual, sort_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Academia de Excel & Productividad', 'excel', 'Aprende fórmulas avanzadas, Power BI, tablas dinámicas y macros aplicadas a finanzas y gestión de negocios.', 'FileSpreadsheet', '#059669', '#064E3B', 19.00, 149.00, 1),
    ('22222222-2222-2222-2222-222222222222', 'Academia de Marketing & Cierres B2B', 'marketing', 'Estrategias de prospección de clientes, tráfico de pago en Meta/Google Ads y negociación de contratos de alto valor.', 'TrendingUp', '#E11D48', '#881337', 24.00, 189.00, 2),
    ('33333333-3333-3333-3333-333333333333', 'Academia de Finanzas & Inversión', 'finanzas', 'Educación patrimonial, gestión de carteras de inversión, análisis de estados financieros y modelos de valuación.', 'Landmark', '#4F46E5', '#312E81', 24.00, 189.00, 3)
ON CONFLICT (slug) DO NOTHING;
