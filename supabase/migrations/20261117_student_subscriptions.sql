-- ============================================================================
-- MIGRACIÓN SUPABASE: GESTIÓN DE SUSCRIPCIONES Y HISTORIAL DE PAGOS DE ALUMNOS
-- Plataforma LMS Marca Blanca & Multitenant
-- ============================================================================

-- 1. AGREGAR COLUMNAS DE SUSCRIPCIÓN EN LA TABLA public.profiles
-- Permite conocer el plan contratado, la fecha exacta de expiración y el estado.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN subscription_plan TEXT DEFAULT 'Membresía Acceso Total';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'subscription_end_date'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN subscription_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN subscription_status TEXT DEFAULT 'active';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end_date 
ON public.profiles(subscription_end_date);

-- ============================================================================
-- 2. TABLA: student_payments (Historial de Pagos y Comprobantes del Alumno)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'refunded')),
    payment_method TEXT DEFAULT 'Tarjeta de Crédito / Débito',
    invoice_number TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_payments_student 
ON public.student_payments(student_id, created_at DESC);

-- ============================================================================
-- 3. VERIFICACIÓN IDEMPOTENTE DE public.lesson_progress
-- Si ya existe en schema.sql se mantiene; de lo contrario se crea.
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

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lookup 
ON public.lesson_progress(student_id, course_id);

-- ============================================================================
-- 4. POLÍTICAS RLS (Row Level Security) PARA PROTECCIÓN DE DATOS
-- ============================================================================
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Los alumnos solo pueden ver sus propios pagos y comprobantes
DROP POLICY IF EXISTS "Los alumnos ven sus propios pagos" ON public.student_payments;
CREATE POLICY "Los alumnos ven sus propios pagos"
ON public.student_payments FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Los Reseller Admins pueden ver los pagos de su academia
DROP POLICY IF EXISTS "Reseller admin ve pagos de su academia" ON public.student_payments;
CREATE POLICY "Reseller admin ve pagos de su academia"
ON public.student_payments FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT p.tenant_id FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.role IN ('reseller_admin', 'superadmin')
    )
);

-- Los alumnos pueden leer y actualizar su propio progreso
DROP POLICY IF EXISTS "Alumnos gestionan su propio progreso" ON public.lesson_progress;
CREATE POLICY "Alumnos gestionan su propio progreso"
ON public.lesson_progress FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- ============================================================================
-- 5. FUNCIÓN RPC: Verificar si el alumno tiene suscripción vigente
-- Devuelve true solo si está activo y subscription_end_date >= NOW()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_student_access_valid(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_end_date TIMESTAMPTZ;
BEGIN
    SELECT is_active, subscription_end_date 
    INTO v_is_active, v_end_date
    FROM public.profiles
    WHERE id = p_student_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Debe estar activo y su fecha de expiración debe ser mayor o igual al momento actual
    IF v_is_active = TRUE AND (v_end_date IS NULL OR v_end_date >= NOW()) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;
