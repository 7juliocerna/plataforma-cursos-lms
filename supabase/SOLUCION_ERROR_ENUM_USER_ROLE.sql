-- ============================================================================
-- SOLUCIÓN DEFINITIVA A ERROR 55P04 (unsafe use of new value "admin")
-- ============================================================================
-- En PostgreSQL no se puede usar un nuevo valor de ENUM en la misma transacción
-- en la que se crea. La solución limpia y recomendada es convertir la columna
-- 'role' directamente a TEXT con restricción CHECK ('admin', 'student').
-- 
-- Esto elimina de raíz la dependencia del enum antiguo y permite que el script
-- corra sin ningún error en Supabase.
-- ============================================================================

-- 1. Quitar default anterior de la columna role
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- 2. Convertir la columna role directamente a TEXT (convierte los valores existentes sin validar enums)
ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::text;

-- 3. Ahora que es TEXT, actualizar de forma segura roles antiguos a 'admin'
UPDATE public.profiles 
SET role = 'admin' 
WHERE role IN ('superadmin', 'reseller_admin', 'reseller', 'owner');

-- 4. Reasignar default 'student' como TEXT
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'student';

-- 5. Agregar restricción CHECK limpia (solo permite 'admin' y 'student')
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'student'));

-- 6. Actualizar la función is_admin() con casteo a TEXT
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role::text = 'admin'
    );
$$;

-- 7. Actualizar la función handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    v_admin_email TEXT := 'ceo@plataformalms.com';
    v_role TEXT := 'student';
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
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    RETURN NEW;
END;
$$;

-- 8. Asegurar trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Mensaje de confirmación
SELECT 'Base de datos reparada con éxito: profiles.role es TEXT con CHECK (admin, student).' AS resultado;
