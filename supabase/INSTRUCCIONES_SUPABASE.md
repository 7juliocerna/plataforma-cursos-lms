# Guía Paso a Paso: Cómo Configurar tu Base de Datos en Supabase (Sin Saber Programar)

¡No necesitas escribir ni una sola línea de código! Solo sigue estos **4 pasos visuales** para dejar tu base de datos PostgreSQL + Seguridad Multitenant lista en menos de 3 minutos:

---

## Paso 1: Crear tu proyecto gratuito en Supabase
1. Entra en [https://supabase.com](https://supabase.com) e inicia sesión (puedes entrar con tu cuenta de Google o GitHub).
2. Haz clic en el botón verde **"New project"**.
3. Elige un nombre (por ejemplo: `LMS Marca Blanca`), inventa una contraseña segura para la base de datos y selecciona la región más cercana a tus alumnos (ej. *East US* o *São Paulo*).
4. Espera unos 60 segundos a que Supabase termine de preparar tu base de datos.

---

## Paso 2: Dónde pegar el archivo `supabase/schema.sql`
1. En el menú lateral izquierdo de Supabase, busca el ícono de terminal llamado **"SQL Editor"** (es el cuarto ícono de arriba hacia abajo) y haz clic en él.
2. Arriba a la izquierda dentro del SQL Editor, haz clic en el botón **"+ New query"**.
3. Abre el archivo [`supabase/schema.sql`](file:///c:/Users/7juli/OneDrive/Escritorio/Plataforma_cursos/supabase/schema.sql) de este proyecto, selecciona todo su contenido (`Ctrl + A`), cópialo (`Ctrl + C`) y **pégalo (`Ctrl + V`)** dentro del cuadro grande en blanco de Supabase.
4. Haz clic en el botón verde **"Run"** (abajo a la derecha en la pantalla de Supabase, o presiona `Ctrl + Enter`).
5. Verás abajo el mensaje: **`Success. No rows returned`**. ¡Eso significa que ya se crearon todas las tablas, los candados de licencias, el detector de sesiones simultáneas y las 3 academias de prueba!

---

## Paso 3: Dónde encontrar tus 2 llaves (API Keys) para conectar la App
1. En el menú izquierdo de Supabase, baja hasta el final y haz clic en **"Project Settings"** (el ícono de engranaje ⚙️).
2. En el submenú que se abre, haz clic en **"API"** (o **"Data API"**).
3. Ahí verás dos datos que necesitamos:
   - **Project URL**: Una dirección que empieza por `https://xxxx.supabase.co`
   - **Project API Keys (`anon` `public`)**: Un código largo que empieza por `eyJ...`
   - *(Opcional para Webhooks y administración avanzada)* **`service_role` `secret`**: El segundo código oculto (haz clic en *Reveal* para verlo).

---

## Paso 4: Conectar tus llaves
1. Puedes pasármelas directamente por el chat cuando quieras conectar tu base de datos real, o pegarlas en el archivo `.env.local` en la raíz del proyecto así:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-llave-anon-publica
   SUPABASE_SERVICE_ROLE_KEY=tu-llave-service-role
   ```
2. **Nota importante**: Mientras no hayas puesto tus llaves de Supabase, la plataforma funciona automáticamente en **Modo Demo Interactivo Completo**, permitiéndote probar todas las pantallas, crear academias, cambiar colores de marca blanca, activar/desactivar alumnos, probar el límite de licencias y simular el bloqueo por doble sesión en tiempo real desde tu navegador.
