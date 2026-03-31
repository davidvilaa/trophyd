"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Clock, Dumbbell, Award } from "lucide-react";

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
          let counts: Record<number, number> = { 0.5: 0, 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0 };

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
            time_played,
            difficulty,
            rating,
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
          transition: height 0.5s ease-out, background-color 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
          cursor: pointer;
          position: relative;
          transform-origin: bottom; 
        }
        
        .rating-bar:hover {
          background-color: #7baaf7;
          transform: scaleX(1.15) scaleY(1.1); 
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          z-index: 10; 
        }

        .fav-case-container {
          position: relative;
          perspective: 1000px;
          aspect-ratio: 3/4;
          z-index: 1;
        }

        .fav-case-container.has-game {
          cursor: pointer;
        }

        .fav-case {
          width: 100%;
          height: 100%;
          position: relative;
          background-size: cover;
          background-position: center;
          border: 2px inset #fff;
          background-color: #e5e7eb;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transform-style: preserve-3d;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
        }

        .fav-case-container.has-game:hover {
          z-index: 20;
        }

        .fav-case-container.has-game:hover .fav-case {
          transform: rotateX(8deg) rotateY(-8deg) scale(1.15) translateZ(30px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3) !important;
        }

        .badges-area {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%) translateZ(50px);
          width: 115%;
          display: flex;
          flex-direction: row;
          justify-content: center;
          gap: 5px;
          opacity: 0;
          transition: opacity 0.2s ease;
          transform-style: preserve-3d;
        }

        .fav-case-container.has-game:hover .badges-area {
          opacity: 1;
        }

        .embedded-badge {
          flex: 1;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.7);
          color: #fff;
          padding: 3px 4px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 5px rgba(0,0,0,0.4);
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .embedded-badge svg {
          stroke-width: 2.5px;
          color: #e3e3e3;
          flex-shrink: 0;
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
            <div key={index} className={`fav-case-container ${fav ? "has-game" : ""}`} title={fav?.games?.title}>
              {fav ? (
                <div 
                  className="fav-case" 
                  style={{ backgroundImage: `url(${fav.games?.cover_image_url})` }}
                >
                  <div className="badges-area">
                    <div className="embedded-badge" title="Time Played">
                      <Clock size={16} />
                      <span>{fav.time_played ? `${fav.time_played}h` : "--h"}</span>
                    </div>
                    <div className="embedded-badge" title="Difficulty">
                      <Dumbbell size={16} />
                      <span>{fav.difficulty || "Default"}</span>
                    </div>
                    <div className="embedded-badge" title="Rating">
                      <span>{fav.rating ? `★ ${fav.rating}` : "★ --"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="fav-case" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "2rem" }}>
                  --
                </div>
              )}
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
}