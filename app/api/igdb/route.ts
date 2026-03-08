import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  const offset = searchParams.get('offset') || '0';
  const limit = '20'; 

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

    const igdbQuery = `search "${palabraLimpia}"; fields name, cover.image_id; limit ${limit}; offset ${offset};`;

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

    const juegosFormateados = games
      .filter((juego: any) => juego.cover?.image_id)
      .map((juego: any) => ({
        id: juego.id,
        titulo: juego.name,
        portada: `https://images.igdb.com/igdb/image/upload/t_cover_big/${juego.cover.image_id}.jpg`
      }));

    console.log(`JUEGOS ENCONTRADOS Y CON FOTO (Offset: ${offset}):`, juegosFormateados.length);

    return NextResponse.json(juegosFormateados);

  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}