# Plataforma LMS Marca Blanca (White-Label) & Multitenant — SaaS B2B

MVP completo de una plataforma de E-Learning **Marca Blanca y Multitenant** diseñada para vender tus propios cursos pregrabados de forma directa, distribuirlos a través de **Resellers (Academias)** con paquetes de licencias y comercializar el sistema como **SaaS B2B**.

---

## 🚀 Despliegue en Vivo y Servicios Conectados
- **Producción en Vercel:** [https://plataforma-cursos-lms-nu.vercel.app](https://plataforma-cursos-lms-nu.vercel.app)
- **Streaming de Video:** Bunny.net Stream (Biblioteca ID: `808934` con reproductor oficial HLS/Plyr).
- **Base de Datos:** Supabase PostgreSQL con RLS y multitenancy activado.
- **Repositorio Oficial:** [https://github.com/7juliocerna/plataforma-cursos-lms](https://github.com/7juliocerna/plataforma-cursos-lms)

---

## Stack Tecnológico
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4.
- **Base de Datos y Seguridad**: Supabase (PostgreSQL + Auth + Row Level Security + Triggers SQL).
- **Alojamiento de Videos**: Arquitectura lista para embeds externos de **Bunny.net Stream** y **Cloudflare Stream** (costo mínimo y cero carga al servidor).
- **Pagos y Suscripciones**: Endpoints de Webhooks listos para **Stripe** (`/api/webhooks/stripe`) y **Mercado Pago** (`/api/webhooks/mercadopago`).

---

## Estructura de Archivos Clave
- [`supabase/schema.sql`](./supabase/schema.sql): Esquema SQL completo con tablas multitenant, políticas RLS, Trigger de límite de licencias (`enforce_tenant_license_limit`) y funciones RPC de sesión única (`register_student_session`, `verify_student_session`).
- [`supabase/INSTRUCCIONES_SUPABASE.md`](./supabase/INSTRUCCIONES_SUPABASE.md): Guía paso a paso (sin saber programar) de cómo importar el SQL en Supabase.
- [`src/middleware.ts`](./src/middleware.ts): Detector automático de Academia por subdominio, dominio personalizado o parámetro `?tenant=`.
- [`src/context/LMSContext.tsx`](./src/context/LMSContext.tsx): Motor reactivo de Marca Blanca, licencias, sesiones únicas y conexión híbrida (Supabase Live + Modo Demo Interactivo).
- [`src/app/page.tsx`](./src/app/page.tsx): Landing Page pública adaptable a la marca de cada Reseller.
- [`src/app/login/page.tsx`](./src/app/login/page.tsx): Login adaptable a la marca con acceso rápido para pruebas de los 3 roles.
- [`src/app/superadmin/page.tsx`](./src/app/superadmin/page.tsx): Panel SuperAdmin (creación de academias, paquetes de licencias, cursos maestros y simulador de webhooks).
- [`src/app/reseller/page.tsx`](./src/app/reseller/page.tsx): Panel Reseller / Admin de Academia (medidor de licencias, alta/baja de alumnos con bloqueo por límite y estudio de marca blanca).
- [`src/app/student/page.tsx`](./src/app/student/page.tsx): Aula Virtual del Alumno (reproductor de video externo de Bunny.net, progreso y bloqueo automático por sesiones simultáneas).
