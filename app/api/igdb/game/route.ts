import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Falta el ID del juego' }, { status: 400 });
  }

  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Faltan las credenciales de Twitch en el .env");
      return NextResponse.json({ error: 'Faltan credenciales del servidor' }, { status: 500 });
    }

    const tokenResponse = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
      method: 'POST',
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("Twitch no nos dio el token:", tokenData);
      return NextResponse.json({ error: 'Error de autenticación con Twitch' }, { status: 500 });
    }

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: `fields name, summary, cover.image_id, artworks.image_id, screenshots.image_id; where id = ${id};`,
    });

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Juego no encontrado en IGDB' }, { status: 404 });
    }

    const game = data[0];

    const coverUrl = game.cover?.image_id 
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` 
      : null;
    
    let bannerUrl = null;
    if (game.screenshots && game.screenshots.length > 0) {
      const randomIndex = Math.floor(Math.random() * game.screenshots.length);
      bannerUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${game.screenshots[randomIndex].image_id}.jpg`;
    } else if (game.artworks && game.artworks.length > 0) {
      const randomIndex = Math.floor(Math.random() * game.artworks.length);
      bannerUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${game.artworks[randomIndex].image_id}.jpg`;
    }

    return NextResponse.json({
      id: game.id,
      title: game.name,
      summary: game.summary || 'Aún no hay una descripción disponible para este juegazo.',
      cover_image_url: coverUrl,
      banner_url: bannerUrl,
    });

  } catch (error) {
    console.error("Error catastrófico en la API:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}