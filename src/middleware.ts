import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware Multitenant y Marca Blanca:
 * Detecta la academia activa por:
 * 1. Parámetro de consulta (?tenant=impulso-digital) -> ideal para desarrollo local y previsualización
 * 2. Subdominio (impulso-digital.tudominio.com)
 * 3. Dominio personalizado (aula.impulsodigital.co)
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || 'localhost:3000';
  const tenantParam = url.searchParams.get('tenant');

  const requestHeaders = new Headers(request.headers);

  if (tenantParam) {
    requestHeaders.set('x-tenant-slug', tenantParam.toLowerCase());
  } else {
    // Extraer subdominio si no es localhost ni IP
    const cleanHost = hostname.split(':')[0];
    if (cleanHost !== 'localhost' && cleanHost !== '127.0.0.1') {
      const parts = cleanHost.split('.');
      if (parts.length >= 3) {
        requestHeaders.set('x-tenant-slug', parts[0].toLowerCase());
      } else {
        requestHeaders.set('x-tenant-domain', cleanHost.toLowerCase());
      }
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
