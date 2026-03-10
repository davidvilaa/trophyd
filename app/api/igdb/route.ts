import { NextResponse } from 'next/server';

const PLATAFORMAS_MAP: Record<number, string> = {
  37: "3ds", 33: "gameboy", 24: "gameboyadvance", 22: "gameboycolor",
  21: "gamecube", 4: "n64", 20: "nds", 18: "nes", 6: "pc", 7: "ps1",
  8: "ps2", 9: "ps3", 48: "ps4", 167: "ps5", 38: "psp", 46: "psvita",
  19: "snes", 130: "switch", 508: "switch2", 5: "wii", 41: "wiiu",
  11: "xbox", 12: "xbox360", 49: "xboxone", 169: "xboxseriesxs"
};

const PRIORIDAD_PLATAFORMAS = [ // Orden de prioridad; plataformas retro primero
  18, 33, 19,  22, 7, 4, 24, 8, 21, 11, 20, 38, 12, 9,  
  5, 37, 46, 41, 48, 49, 130, 167,169, 508, 6
];

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

    const igdbQuery = `search "${palabraLimpia}"; fields name, cover.image_id, total_rating_count, category, platforms; limit 500;`;

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
      let consolaAsignada = null;
      
      if (juego.platforms) {
        const plataformasOrdenadas = juego.platforms.sort((a: number, b: number) => {
          const indexA = PRIORIDAD_PLATAFORMAS.indexOf(a);
          const indexB = PRIORIDAD_PLATAFORMAS.indexOf(b);
          
          const pesoA = indexA === -1 ? 999 : indexA;
          const pesoB = indexB === -1 ? 999 : indexB;
          
          return pesoA - pesoB;
        });

        for (const platID of plataformasOrdenadas) {
          if (PLATAFORMAS_MAP[platID]) {
            consolaAsignada = PLATAFORMAS_MAP[platID];
            break;
          }
        }
      }

      return {
        id: juego.id,
        titulo: juego.name,
        portada: `https://images.igdb.com/igdb/image/upload/t_cover_big/${juego.cover.image_id}.jpg`,
        consola: consolaAsignada
      };
    });

    return NextResponse.json(juegosFormateados);

  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}