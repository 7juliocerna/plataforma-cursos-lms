import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Genera la URL de Embed de Bunny.net Stream firmada con SHA-256 (Embed View Token Authentication)
 * Fórmula oficial de Bunny Stream: SHA256_HEX(token_security_key + video_id + expires)
 */
export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId');
  const libraryId =
    req.nextUrl.searchParams.get('libraryId') ||
    process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID ||
    '808934';

  const tokenSecurityKey =
    req.nextUrl.searchParams.get('tokenKey') ||
    process.env.BUNNY_TOKEN_SECURITY_KEY ||
    '';

  if (!videoId) {
    return NextResponse.json({ error: 'Falta videoId' }, { status: 400 });
  }

  // Si hay Token Security Key configurada, firmamos el embed con expiración de 6 horas
  if (tokenSecurityKey && tokenSecurityKey.trim().length > 0) {
    const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 6;
    const rawString = `${tokenSecurityKey.trim()}${videoId}${expires}`;
    const token = crypto.createHash('sha256').update(rawString).digest('hex');

    const signedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}&autoplay=false&loop=false&muted=false&preload=true&responsive=true`;

    return NextResponse.json({
      signed: true,
      embedUrl: signedUrl,
      expires,
    });
  }

  // Sin firma si Embed View Token Authentication está desactivado en Bunny Security
  const unsignedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;
  return NextResponse.json({
    signed: false,
    embedUrl: unsignedUrl,
  });
}
