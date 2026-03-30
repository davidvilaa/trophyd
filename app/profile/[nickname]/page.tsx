"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileContentPage() {
  const router = useRouter();
  const params = useParams();
  const targetNickname = params.nickname as string;

  const [loading, setLoading] = useState(true);
  const [notaMedia, setNotaMedia] = useState(0);
  const [distribucionNotas, setDistribucionNotas] = useState<Record<number, number>>({
    0.5: 0, 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0
  });
  const [maxNotaCount, setMaxNotaCount] = useState(1);
  const [favoritos, setFavoritos] = useState<any[]>([]);

  useEffect(() => {
    const cargarDatosPerfil = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }

        const { data: targetProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("nickname", targetNickname)
          .single();

        if (!targetProfile) {
          setLoading(false);
          return;
        }

        const targetUserId = targetProfile.id; 

        const { data: ratingsData } = await supabase
          .from("user_games")
          .select("rating")
          .eq("user_id", targetUserId)
          .not("rating", "is", null);

        if (ratingsData && ratingsData.length > 0) {
          let suma = 0;
          let counts: Record<number, number> = { 0.5: 0, 1: 0, 1.5: 0, 2: 2, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0 };

          ratingsData.forEach((row) => {
            const nota = Number(row.rating);
            suma += nota;
            
            const bucket = Math.round(nota * 2) / 2;
            if (counts[bucket] !== undefined) {
              counts[bucket] += 1;
            }
          });

          setNotaMedia(Number((suma / ratingsData.length).toFixed(1)));
          setDistribucionNotas(counts);
          setMaxNotaCount(Math.max(...Object.values(counts), 1));
        } else {
          setNotaMedia(0);
          setDistribucionNotas({ 0.5: 0, 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0 });
          setMaxNotaCount(1);
        }

        const { data: favsData } = await supabase
          .from("user_games")
          .select(`
            game_id,
            games (
              title,
              cover_image_url
            )
          `)
          .eq("user_id", targetUserId)
          .eq("isFavorite", true)
          .limit(5);

        if (favsData) {
          setFavoritos(favsData);
        } else {
          setFavoritos([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (targetNickname) {
      cargarDatosPerfil();
    }
  }, [router, targetNickname]);

  const favoritosMostrados = Array(5).fill(null).map((_, index) => favoritos[index] || null);

  const escalas = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Cargando estadísticas...</div>;
  }

  return (
    <div style={{ display: "flex", gap: "30px", alignItems: "stretch" }}>
      <style>{`
        .rating-bar {
          background-color: #b9d5fa;
          /* Mantenemos height, añadimos transform y shadow con la curva cubic-bezier premium */
          transition: height 0.5s ease-out, background-color 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
          cursor: pointer;
          position: relative;
          /* CLAVE: La barra crece hacia ARRIBA desde la base */
          transform-origin: bottom; 
        }
        
        .rating-bar:hover {
          background-color: #7baaf7;
          /* Pop-out: Crece un 15% a lo ancho y un 10% a lo alto */
          transform: scaleX(1.15) scaleY(1.1); 
          /* Sombra suave para dar relieve */
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          /* Se pone por encima de las barras vecinas */
          z-index: 10; 
        }
      `}</style>
      
      <fieldset style={{ width: "280px", padding: "20px", display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
        <legend style={{ fontSize: "18px" }}>Ratings</legend>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto" }}>
          <div style={{ 
            display: "flex", alignItems: "flex-end", justifyContent: "space-between", 
            height: "120px", borderBottom: "0px solid #888", paddingBottom: "2px", gap: "2px"
          }}>
            {escalas.map((estrella) => {
              const heightPercent = maxNotaCount > 0 ? (distribucionNotas[estrella] / maxNotaCount) * 100 : 0;
              return (
                <div 
                  key={estrella}
                  className="rating-bar"
                  onClick={() => {
                    if (distribucionNotas[estrella] > 0) {
                      router.push(`/profile/${targetNickname}/games?rating=${estrella}`);
                    }
                  }}
                  style={{ 
                    flex: 1, 
                    height: `${Math.max(heightPercent, 2)}%`
                  }} 
                  title={`${estrella} Estrellas: ${distribucionNotas[estrella]} juegos`}
                ></div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between"}}>
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#666" }}>1☆</span>
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#666" }}>5☆</span>
          </div>
        </div>
      </fieldset>

      <fieldset style={{ flex: 1, padding: "20px", backgroundColor: "#fff" }}>
        <legend style={{ fontSize: "18px" }}>Favorite Games</legend>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px" }}>
          {favoritosMostrados.map((fav, index) => (
            <div key={index} className={fav ? "game-card" : ""} style={{ 
              aspectRatio: "3/4", backgroundColor: "#e5e7eb", border: "2px inset #fff",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "2rem",
              backgroundImage: fav ? `url(${fav.games?.cover_image_url})` : "none",
              backgroundSize: "cover", backgroundPosition: "center"
            }}>
              {!fav && <span style={{ fontSize: "1.5rem" }}>--</span>}
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
}