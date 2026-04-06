"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Clock, Dumbbell, Award, X, MoveLeft, MoveRight, House, FileEdit } from "lucide-react";
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

  const getDifficultyColor = (diff: number | null | undefined) => {
    if (!diff) return "rgba(20, 30, 40, 0.5)";
    const d = Math.round(Number(diff));
    if (d <= 3) return "rgba(21, 128, 61, 0.6)";
    if (d <= 5) return "rgba(101, 163, 13, 0.6)";
    if (d <= 7) return "rgba(202, 138, 4, 0.6)";
    if (d === 8) return "rgba(194, 65, 12, 0.6)";
    if (d === 9) return "rgba(185, 28, 28, 0.6)";
    return "rgba(127, 29, 29, 0.8)";
  };

  const getTimeColor = (hours: number | null | undefined) => {
    if (!hours) return "rgba(20, 30, 40, 0.5)"; 
    const h = Number(hours);
    if (h <= 5) return "rgba(21, 128, 61, 0.6)";
    if (h <= 10) return "rgba(101, 163, 13, 0.6)";
    if (h <= 30) return "rgba(202, 138, 4, 0.6)";
    if (h <= 50) return "rgba(217, 119, 6, 0.6)";
    if (h <= 80) return "rgba(194, 65, 12, 0.6)";
    if (h <= 100) return "rgba(154, 52, 18, 0.6)";
    if (h <= 300) return "rgba(185, 28, 28, 0.6)";
    return "rgba(127, 29, 29, 0.8)";
  };

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

          .case-overlay-container {
            position: absolute;
            top: 0; bottom: 0; left: 0; right: 0;
            opacity: 0;
            transition: opacity 0.2s ease;
            transform-style: preserve-3d;
            pointer-events: none;
          }

          .fav-case-container.has-game:hover .case-overlay-container {
            opacity: 1;
          }

          .badges-row {
            position: absolute;
            top: 8px;
            left: 0; right: 0;
            display: flex;
            justify-content: center;
            gap: 4px;
            padding: 0 8px;
            transform: translateZ(30px);
            transform-style: preserve-3d;
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
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 3px;
            box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 3px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.5);
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

          .stars-row {
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%) translateZ(40px); 
            display: flex;
            justify-content: center;
            gap: 6px;
            font-size: 2.2rem;
            color: rgba(255, 255, 255, 0.4); 
            width: max-content;
            transform-style: preserve-3d;
            pointer-events: auto;
          }

          .stars-row span {
            transition: color 0.15s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.15s ease;
            filter: drop-shadow(0 5px 6px rgba(0,0,0,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.3));
            cursor: pointer;
          }

          .stars-row span:hover {
            transform: translateY(-6px) translateZ(20px) scale(1.3);
            color: #fbbf24;
            filter: drop-shadow(0 0 12px rgba(251, 191, 36, 1)) drop-shadow(0 8px 8px rgba(0,0,0,0.9));
          }

          .stars-row span.active {
            color: #fbbf24; 
            filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.7)) drop-shadow(0 3px 5px rgba(0,0,0,0.9));
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
                    <div className="case-overlay-container">
                      <div className="badges-row">
                        <div className="embedded-badge" title="Time Played" style={{ backgroundColor: getTimeColor(fav.time_played) }}>
                          <Clock size={16} />
                          <span>{fav.time_played ? `${fav.time_played}h` : "--h"}</span>
                        </div>
                        <div className="embedded-badge" title="Difficulty" style={{ backgroundColor: getDifficultyColor(fav.difficulty) }}>
                          <Dumbbell size={16} />
                          <span>{fav.difficulty || "Default"}</span>
                        </div>
                      </div>

                      <div className="stars-row">
                        {[1, 2, 3, 4, 5].map((starIndex) => (
                          <span 
                            key={starIndex}
                            className={fav.rating && fav.rating >= starIndex ? "active" : ""}
                          >
                            ★
                          </span>
                        ))}
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
          
          <div 
            className="window glass active" 
            style={{ 
              position: "absolute", 
              top: "30px",
              width: "90%", 
              maxWidth: "1100px",
              zIndex: 120 
            }}
          >
            <div className="title-bar">
              <div className="title-bar-text" style={{ fontSize: "14px" }}>
              </div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close" onClick={() => { setFocusedGame(null); setIsLogging(false); }}></button>
              </div>
            </div>
          </div>

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
            <div className="window-body" style={{ display: "flex", gap: "10px", alignItems: "center", margin: 0 }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0", marginRight: "10px", height: "35px" }}>
                <button 
                  onClick={() => {
                    const consolas = focusedGame.todasLasConsolas?.length > 0 ? focusedGame.todasLasConsolas : ["pc"];
                    const index = consolas.indexOf(consolaFocus || "pc");
                    const prevIndex = index <= 0 ? consolas.length - 1 : index - 1;
                    setConsolaFocus(consolas[prevIndex]);
                  }}
                  style={{ width: "35px", height: "100%", cursor: "pointer", padding: 0, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}
                >
                  <MoveLeft size={18} />
                </button>

                <select 
                  value={consolaFocus || "pc"} 
                  onChange={(e) => setConsolaFocus(e.target.value)}
                  style={{ width: "160px", height: "100%", cursor: "pointer", padding: "0 10px", margin: 0, boxSizing: "border-box", borderRadius: 0 }}
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
                  style={{ width: "35px", height: "100%", cursor: "pointer", padding: 0, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}
                >
                  <MoveRight size={18} />
                </button>
              </div>

              <button 
                onClick={() => router.push(`/game/${focusedGame.id}`)}
                style={{ minWidth: "35px", height: "35px", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}
                title="Ver Ficha Técnica"
              >
                <House size={18} />
              </button>

              <button 
                onClick={() => setIsLogging(!isLogging)}
                className={isLogging ? "active" : ""}
                style={{ minWidth: "35px", height: "35px", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isLogging ? "#e3e3e3" : "", boxShadow: isLogging ? "inset 0 2px 4px rgba(0,0,0,0.25)" : "", boxSizing: "border-box" }}
                title={isLogging ? "Volver a Portada" : "Editar Juego"}
              >
                {isLogging ? <MoveLeft size={18} /> : <FileEdit size={18} />}
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