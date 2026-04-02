"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Clock, Dumbbell, Award, X, MoveLeft, MoveRight } from "lucide-react";
import GameCard3D from "@/components/gameCard3D";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { platform } from "os";

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

  const mainRef = useRef<HTMLDivElement>(null!);
  const [focusedGame, setFocusedGame] = useState<any | null>(null);
  const [consolaFocus, setConsolaFocus] = useState<string | null>("pc");
  const [isLogging, setIsLogging] = useState(false);
  const [notificacion, setNotificacion] = useState<{ titulo: string, mensaje: string } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const comprobarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        setCurrentUserId(session.user.id);
      }
    };
    comprobarSesion();
  }, [router]);

  const cargarDatosPerfil = async () => {
    setLoading(true);
    try {
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
          platform,
          games (
            title,
            cover_image_url,
            platforms
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

  useEffect(() => {
    if (targetNickname) {
      cargarDatosPerfil();
    }
  }, [targetNickname]);

  useEffect(() => {
    if (focusedGame) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [focusedGame]);

  const cerrarNotificacion = () => {
    setIsClosing(true);
    setTimeout(() => {
      setNotificacion(null);
      setIsClosing(false);
    }, 500);
  };

  const favoritosMostrados = Array(5).fill(null).map((_, index) => favoritos[index] || null);
  const escalas = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Cargando estadísticas...</div>;
  }

  return (
    <div ref={mainRef} style={{ position: "relative", minHeight: "100%" }}>
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
            flex: 1 1 0%; 
            justify-content: center;
            
            background-color: rgba(20, 30, 40, 0.5); 
            background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 49%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.6) 100%);
            
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-top-color: rgba(255, 255, 255, 0.7); 
            border-bottom-color: rgba(0, 0, 0, 0.8);   
            border-radius: 6px;
            
            color: #fff;
            padding: 3px 4px;
            font-size: 11px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 4px;
            
            box-shadow: 
              inset 0 1px 1px rgba(255, 255, 255, 0.7), 
              inset 0 -1px 3px rgba(0, 0, 0, 0.5), 
              0 4px 10px rgba(0, 0, 0, 0.6);
              
            text-transform: capitalize;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            
            text-shadow: 0 1px 2px rgba(0,0,0,0.9);
          }

          .embedded-badge svg {
            stroke-width: 2.5px;
            color: #fff;
            flex-shrink: 0;
            filter: drop-shadow(0 1px 1px rgba(0,0,0,0.8));
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
              <div 
                key={index} 
                className={`fav-case-container ${fav ? "has-game" : ""}`} 
                title={fav?.games?.title}
                onClick={() => {
                  if (fav) {
                    setFocusedGame({
                      id: fav.game_id,
                      titulo: fav.games.title,
                      portada: fav.games.cover_image_url,
                      platform: fav.platform,
                      todasLasConsolas: fav.games.platforms
                    });
                    setIsLogging(true);
                  }
                }}
              >
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

      {focusedGame && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(5px)",
          zIndex: 100000, display: "flex", flexDirection: "column",
          justifyContent: "flex-end", alignItems: "center", paddingBottom: "30px" 
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 105 }}>
            <GameCard3D 
              coverUrl={focusedGame.portada} 
              consola={consolaFocus}
              isFocused={true} 
              isLogging={isLogging}
              juego={focusedGame} 
              userId={currentUserId}
              onPlatformFetched={(plat) => setConsolaFocus(plat)}
              onSaveSuccess={(action) => {
                setIsLogging(false); 
                setFocusedGame(null);
                cargarDatosPerfil();
                setNotificacion({
                  titulo: action === "deleted" ? "¡Juego Borrado!" : "¡Juego Actualizado!",
                  mensaje: action === "deleted" 
                    ? `Has eliminado ${focusedGame.titulo} de tu colección.` 
                    : `Has actualizado ${focusedGame.titulo} con éxito.`
                });
                setTimeout(() => cerrarNotificacion(), 3000);
              }} 
            />
          </div>

          <div className="window" style={{ zIndex: 110, width: "auto", padding: "10px", position: "relative" }}>
            <div className="window-body" style={{ display: "flex", gap: "15px", alignItems: "center", margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <button 
                  onClick={() => {
                    const consolas = focusedGame.todasLasConsolas?.length > 0 ? focusedGame.todasLasConsolas : ["pc"];
                    const index = consolas.indexOf(consolaFocus || "pc");
                    const prevIndex = index <= 0 ? consolas.length - 1 : index - 1;
                    setConsolaFocus(consolas[prevIndex]);
                  }}
                  style={{ minWidth: "30px", cursor: "pointer", padding: "2px" }}
                >
                  <MoveLeft size={18} />
                </button>

                <select 
                  value={consolaFocus || "pc"} 
                  onChange={(e) => setConsolaFocus(e.target.value)}
                  style={{ minWidth: "160px", cursor: "pointer", padding: "3px" }}
                >
                  {focusedGame.todasLasConsolas && focusedGame.todasLasConsolas.length > 0 ? (
                    focusedGame.todasLasConsolas.map((c: string) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))
                  ) : (
                    <option value="pc">PC</option>
                  )}
                </select>

                <button 
                  onClick={() => {
                    const consolas = focusedGame.todasLasConsolas?.length > 0 ? focusedGame.todasLasConsolas : ["pc"];
                    const index = consolas.indexOf(consolaFocus || "pc");
                    const nextIndex = index >= consolas.length - 1 ? 0 : index + 1;
                    setConsolaFocus(consolas[nextIndex]);
                  }}
                  style={{ minWidth: "30px", cursor: "pointer", padding: "2px" }}
                >
                  <MoveRight size={18} />
                </button>
              </div>
              <button 
                onClick={() => setIsLogging(!isLogging)}
                style={{ fontWeight: "bold", padding: "5px 15px", cursor: "pointer" }}
              >
                {isLogging ? "Volver a Portada" : "Editar Juego"}
              </button>

              <button 
                onClick={() => { setFocusedGame(null); setIsLogging(false); }}
                style={{ 
                  minWidth: "40px", padding: "4px", cursor: "pointer", color: "#dc2626",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
                title="Cerrar"
              >
                <X size={20} strokeWidth={4} />
              </button>
            </div>
          </div>
        </div>
      )}

      <Canvas
        eventSource={mainRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 10 }}
        camera={{ position: [0, 0, 22], fov: 20 }}
      >
        <View.Port />
      </Canvas>

      {notificacion && (
        <div style={{ position: "fixed", top: "80px", left: "20px", zIndex: 9999, opacity: isClosing ? 0 : 1, transition: "opacity 0.5s ease-in-out" }}>
          <div role="tooltip" style={{ position: "relative", width: "300px", maxWidth: "90vw", backgroundColor: "#ffffe1", border: "1px solid #000", padding: "10px", boxShadow: "2px 2px 5px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px", color: "#000", fontSize: "14px" }}>
                {notificacion.titulo}
              </span>
              <button onClick={() => setNotificacion(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <X size={14} strokeWidth={3} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#333", lineHeight: "1.4" }}>
              {notificacion.mensaje}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}