-- ============================================================================
-- SQL LIMPIO: NUEVA ARQUITECTURA MULTI-ACADEMIA (UN SOLO DUEÑO Y VENDEDOR)
-- ============================================================================
-- Instrucciones para Supabase:
-- 1. Ve a tu proyecto en Supabase (https://supabase.com/dashboard)
-- 2. Entra en "SQL Editor" -> "+ New query"
-- 3. Pega este contenido y presiona "Run"
-- ============================================================================

-- 1. EXTENSIÓN
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- 2. TABLA: academies (Academias temáticas propias)
CREATE TABLE IF NOT EXISTS public.academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT NOT NULL DEFAULT 'GraduationCap',
    primary_color TEXT NOT NULL DEFAULT '#10B981',
    secondary_color TEXT NOT NULL DEFAULT '#064E3B',
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 19.00,
    price_annual NUMERIC(10, 2) NOT NULL DEFAULT 149.00,
    sort_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: profiles (Vinculado a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    is_all_access BOOLEAN NOT NULL DEFAULT false,
    all_access_end_date TIMESTAMPTZ,
    active_session_id TEXT,
    active_session_device TEXT,
    last_session_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- 4. TABLA: academy_subscriptions (Suscripciones por Academia o Pase Total)
CREATE TABLE IF NOT EXISTS public.academy_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE,
    is_all_access BOOLEAN NOT NULL DEFAULT false,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA: courses
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

-- 6. TABLA: modules
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_subtema_zero BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLA: lessons
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

-- 8. TABLA: lesson_progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT true,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, lesson_id)
);

-- 9. TABLA: global_payment_settings
CREATE TABLE IF NOT EXISTS public.global_payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mercadopago_public_key TEXT,
    mercadopago_access_token TEXT,
    mercadopago_webhook_secret TEXT,
    yape_phone TEXT DEFAULT '987654321',
    yape_qr_url TEXT,
    plin_phone TEXT DEFAULT '987654321',
    bank_transfer_info TEXT DEFAULT 'BCP Soles: 191-00000000-0-00 / CCI: 00219100000000000000',
    currency TEXT NOT NULL DEFAULT 'USD',
    all_access_price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 29.00,
    all_access_price_annual NUMERIC(10, 2) NOT NULL DEFAULT 240.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABLA: student_payments
CREATE TABLE IF NOT EXISTS public.student_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
    is_all_access BOOLEAN NOT NULL DEFAULT false,
    plan_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_method TEXT NOT NULL DEFAULT 'Mercado Pago',
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'rejected')),
    invoice_number TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TRIGGER: Sincronizar Usuario nuevo con profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_email TEXT := 'ceo@plataformalms.com';
    v_role public.app_role := 'student';
BEGIN
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

-- 12. ROW LEVEL SECURITY
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text = 'admin');
$$;

CREATE POLICY "Academias públicas" ON public.academies FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin academias" ON public.academies FOR ALL USING (public.is_admin());

CREATE POLICY "Perfiles propios" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Actualizar perfil propio" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Cursos publicados" ON public.courses FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Admin cursos" ON public.courses FOR ALL USING (public.is_admin());

CREATE POLICY "Modulos lectura" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Admin modulos" ON public.modules FOR ALL USING (public.is_admin());

CREATE POLICY "Lecciones lectura" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admin lecciones" ON public.lessons FOR ALL USING (public.is_admin());

CREATE POLICY "Progreso alumno" ON public.lesson_progress FOR ALL USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Suscripciones alumno" ON public.academy_subscriptions FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin suscripciones" ON public.academy_subscriptions FOR ALL USING (public.is_admin());

CREATE POLICY "Admin pagos config" ON public.global_payment_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Pagos alumno" ON public.student_payments FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin pagos" ON public.student_payments FOR ALL USING (public.is_admin());

-- 13. SEMILLA DE ACADEMIAS INICIALES
INSERT INTO public.global_payment_settings (currency, all_access_price_monthly, all_access_price_annual, yape_phone, plin_phone, bank_transfer_info)
VALUES ('USD', 29.00, 240.00, '987 654 321', '987 654 321', 'BCP Soles: 191-88492019-0-44 (CCI: 0021910088492019044) — Titular: Julio Cerna')
ON CONFLICT DO NOTHING;

INSERT INTO public.academies (id, title, slug, description, icon_name, primary_color, secondary_color, price_monthly, price_annual, sort_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Academia de Excel & Productividad', 'excel', 'Fórmulas avanzadas, Power BI, dashboards financieros y macros automatizadas.', 'FileSpreadsheet', '#059669', '#064E3B', 19.00, 149.00, 1),
    ('22222222-2222-2222-2222-222222222222', 'Academia de Marketing & Cierres B2B', 'marketing', 'Prospección comercial, tráfico pagado en Meta y Google Ads, y negociación de contratos.', 'TrendingUp', '#E11D48', '#881337', 24.00, 189.00, 2),
    ('33333333-3333-3333-3333-333333333333', 'Academia de Finanzas & Inversión', 'finanzas', 'Educación patrimonial, gestión de portafolios de inversión y análisis bursátil.', 'Landmark', '#4F46E5', '#312E81', 24.00, 189.00, 3)
ON CONFLICT (slug) DO NOTHING;
