import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = 20; 

  if (!query) {
    return NextResponse.json({ error: 'Falta la búsqueda' }, { status: 400 });
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  try {
    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
      method: 'POST',
      cache: 'no-store' 
    });
    const tokenData = await tokenRes.json();
    
    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'Fallo de Twitch' }, { status: 500 });
    }

    const accessToken = tokenData.access_token;
    const palabraLimpia = query.trim();

    const igdbQuery = `search "${palabraLimpia}"; fields name, cover.image_id, total_rating_count, category; limit 500;`;

    const igdbRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId!,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'text/plain',
      },
      body: igdbQuery,
      cache: 'no-store'
    });

    const games = await igdbRes.json();

    if (!igdbRes.ok) {
      return NextResponse.json({ error: 'Fallo de IGDB' }, { status: 500 });
    }

    const categoriasValidas = [0, 4, 8, 9, 10, 11];

    const juegosValidos = games.filter((juego: any) => {
      const tienePortada = juego.cover && juego.cover.image_id;
      const esCategoriaValida = juego.category === undefined || categoriasValidas.includes(juego.category);
      return tienePortada && esCategoriaValida;
    });

    juegosValidos.sort((a: any, b: any) => {
      const popA = a.total_rating_count || 0;
      const popB = b.total_rating_count || 0;
      
      if (popB !== popA) {
        return popB - popA;
      }
      return a.name.localeCompare(b.name);
    });

    const juegosPaginados = juegosValidos.slice(offset, offset + limit);

    const juegosFormateados = juegosPaginados.map((juego: any) => ({
      id: juego.id,
      titulo: juego.name,
      portada: `https://images.igdb.com/igdb/image/upload/t_cover_big/${juego.cover.image_id}.jpg`
    }));

    return NextResponse.json(juegosFormateados);

  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}