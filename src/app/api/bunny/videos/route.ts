import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint Oficial de Integración con Bunny.net Stream API
 * GET /api/bunny/videos -> Lista los videos reales y las Colecciones (Subtemas) subidos a tu Video Library de Bunny.net
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const libraryId =
    searchParams.get('libraryId') || process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
  const apiKey =
    req.headers.get('x-bunny-api-key') || process.env.BUNNY_STREAM_API_KEY;

  if (
    !libraryId ||
    !apiKey ||
    libraryId === '000000' ||
    apiKey === 'tu-api-key-de-bunny'
  ) {
    return NextResponse.json(
      {
        configured: false,
        message:
          'Bunny.net Stream aún no tiene Library ID y API Key configuradas en .env.local.',
        videos: [],
        collections: [],
      },
      { status: 200 }
    );
  }

  try {
    const [videosRes, collectionsRes] = await Promise.all([
      fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=100&orderBy=date`,
        {
          method: 'GET',
          headers: {
            AccessKey: apiKey,
            accept: 'application/json',
          },
          cache: 'no-store',
        }
      ),
      fetch(
        `https://video.bunnycdn.com/library/${libraryId}/collections?page=1&itemsPerPage=100`,
        {
          method: 'GET',
          headers: {
            AccessKey: apiKey,
            accept: 'application/json',
          },
          cache: 'no-store',
        }
      ),
    ]);

    if (!videosRes.ok) {
      const errorText = await videosRes.text();
      return NextResponse.json(
        {
          configured: true,
          ok: false,
          message: `Error de Bunny.net API (HTTP ${videosRes.status}): Verifica que el Library ID (${libraryId}) y la API Key sean correctos.`,
          details: errorText,
          videos: [],
          collections: [],
        },
        { status: videosRes.status }
      );
    }

    const videosData = await videosRes.json();
    const collectionsData = collectionsRes.ok
      ? await collectionsRes.json()
      : { items: [] };

    const rawCollections = Array.isArray(collectionsData.items)
      ? collectionsData.items
      : [];

    const collectionMap = new Map<string, string>();
    const collections = rawCollections.map((c: Record<string, unknown>) => {
      const guid = String(c.guid || '');
      const name = String(c.name || 'Subtema sin nombre');
      collectionMap.set(guid, name);
      return {
        guid,
        name,
        videoCount: Number(c.videoCount || 0),
      };
    });

    const items = Array.isArray(videosData.items) ? videosData.items : [];

    const videos = items.map((v: Record<string, unknown>) => {
      const collectionId = v.collectionId ? String(v.collectionId) : null;
      const collectionName = collectionId
        ? collectionMap.get(collectionId) || null
        : null;

      return {
        guid: String(v.guid || ''),
        title: String(v.title || 'Video sin título'),
        collectionId,
        collectionName,
        lengthSeconds: Number(v.length || 0),
        durationMinutes: Math.max(1, Math.round(Number(v.length || 60) / 60)),
        status: Number(v.status || 0),
        views: Number(v.views || 0),
        libraryId: String(libraryId),
        embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${v.guid}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`,
        directPlayUrl: `https://iframe.mediadelivery.net/play/${libraryId}/${v.guid}`,
      };
    });

    // Ordenar videos en orden numérico y alfabético natural (ej: 0.1, 1.1, 1.2, 1.10, 2.1, A-Z)
    videos.sort((a: { title: string }, b: { title: string }) =>
      a.title.localeCompare(b.title, 'es', { numeric: true, sensitivity: 'base' })
    );

    collections.sort((a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name, 'es', { numeric: true, sensitivity: 'base' })
    );

    return NextResponse.json({
      configured: true,
      ok: true,
      libraryId,
      totalItems: videosData.totalItems ?? videos.length,
      collections,
      videos,
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        ok: false,
        message: 'Error de red al conectar con video.bunnycdn.com',
        details: String(error),
        videos: [],
        collections: [],
      },
      { status: 500 }
    );
  }
}
