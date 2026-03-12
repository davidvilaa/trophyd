import { NextResponse } from 'next/server';

const PLATAFORMAS_MAP: Record<number, string> = {
  37: "3ds", 33: "gameboy", 24: "gameboyadvance", 22: "gameboycolor",
  21: "gamecube", 4: "n64", 20: "nds", 18: "nes", 6: "pc", 7: "ps1",
  8: "ps2", 9: "ps3", 48: "ps4", 167: "ps5", 38: "psp", 46: "psvita",
  19: "snes", 130: "switch", 508: "switch2", 5: "wii", 41: "wiiu",
  11: "xbox", 12: "xbox360", 49: "xboxone", 169: "xboxseriesxs"
};

const CONSOLAS_YEARS: Record<number, number> = {
  18: 1983, 33: 1989, 19: 1990, 22: 1998,7:  1994, 4:  1996, 24: 2001, 8:  2000, 21: 2001, 11: 2001, 20: 2004, 
  38: 2004, 12: 2005,9:  2006, 5:  2006, 37: 2011, 46: 2011,41: 2012, 48: 2013, 49: 2013,130: 2017,167: 2020, 
  169: 2020, 508: 2025, 6:  2000
};

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

    const igdbQuery = `search "${palabraLimpia}"; fields name, cover.image_id, total_rating_count, category, platforms, first_release_date; limit 500;`;

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

    const juegosFormateados = juegosPaginados.map((juego: any) => {
      const opcionesConsolas = juego.platforms
        ? juego.platforms
            .map((id: number) => PLATAFORMAS_MAP[id])
            .filter((nombre: string) => nombre != null)
        : [];

      let consolaAsignada = null;
      
      let anioJuego = 2000;
      if (juego.first_release_date) {
        anioJuego = new Date(juego.first_release_date * 1000).getFullYear();
      }

      if (opcionesConsolas.length > 0) {
        const plataformasIDs = juego.platforms.filter((id: number) => PLATAFORMAS_MAP[id]);
        plataformasIDs.sort((a: number, b: number) => {
          const distA = Math.abs(anioJuego - (CONSOLAS_YEARS[a] || 2000));
          const distB = Math.abs(anioJuego - (CONSOLAS_YEARS[b] || 2000));
          return distA - distB;
        });
        consolaAsignada = PLATAFORMAS_MAP[plataformasIDs[0]];
      }

      return {
        id: juego.id,
        titulo: juego.name,
        portada: `https://images.igdb.com/igdb/image/upload/t_cover_big/${juego.cover.image_id}.jpg`,
        consola: consolaAsignada,
        todasLasConsolas: [...new Set(opcionesConsolas)]
      };
    });

    return NextResponse.json(juegosFormateados);

  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}