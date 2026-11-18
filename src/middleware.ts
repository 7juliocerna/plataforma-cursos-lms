import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de Plataforma Multi-Academia (Un Solo Dueño)
 * Redirecciona rutas obsoletas de resellers hacia el panel del Administrador
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Redirigir la ruta obsoleta /reseller al panel de administración
  if (url.pathname.startsWith('/reseller')) {
    url.pathname = '/superadmin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
