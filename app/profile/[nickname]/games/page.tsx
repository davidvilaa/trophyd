"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eraser, Clock, Dumbbell, X, MoveLeft, MoveRight, Share } from "lucide-react";
import GameCard3D from "@/components/gameCard3D";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";

export default function ProfileGamesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetNickname = params.nickname as string;

  const [loading, setLoading] = useState(true);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [filterStatus, setFilterStatus] = useState("completed");
  const ratingFromUrl = searchParams.get("rating");
  const [filterRating, setFilterRating] = useState(ratingFromUrl || "all");
  const [sortBy, setSortBy] = useState("added_desc");

  const mainRef = useRef<HTMLDivElement>(null!);
  const [focusedGame, setFocusedGame] = useState<any | null>(null);
  const [consolaFocus, setConsolaFocus] = useState<string | null>("pc");
  const [isLogging, setIsLogging] = useState(false);
  const [notificacion, setNotificacion] = useState<{ titulo: string, mensaje: string } | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [infoPos, setInfoPos] = useState({ x: 0, y: 0 });
  const [draggingInfo, setDraggingInfo] = useState(false);
  const isDraggingRef = useRef(false);

  const cargarJuegos = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("nickname", targetNickname)
        .single();

      if (!profile) return;

      const { data: allGamesData } = await supabase
        .from("user_games")
        .select(`*, games (title, cover_image_url, platforms)`)
        .eq("user_id", profile.id);

      if (allGamesData) setAllGames(allGamesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const comprobarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUserId(session.user.id);
    };
    comprobarSesion();
  }, []);

  useEffect(() => {
    if (targetNickname) cargarJuegos();
  }, [targetNickname]);

  useEffect(() => {
    if (focusedGame) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [focusedGame]);

  const clearFilters = () => {
    setFilterRating("all");
    setSortBy("added_desc");
    router.replace(`/profile/${targetNickname}/games`, { scroll: false });
  };

  const cerrarNotificacion = () => {
    setIsClosing(true);
    setTimeout(() => {
      setNotificacion(null);
      setIsClosing(false);
    }, 500);
  };

  const hasActiveFilters = filterRating !== "all" || sortBy !== "added_desc";

  const processedGames = allGames
    .filter((g) => g.status === filterStatus)
    .filter((g) => filterRating === "all" || Number(g.rating) === Number(filterRating))
    .sort((a, b) => {
      if (sortBy === "added_desc") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === "title_asc") return a.games.title.localeCompare(b.games.title);
      if (sortBy === "title_desc") return b.games.title.localeCompare(a.games.title);
      if (sortBy === "rating_desc") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "time_desc") return (b.time_played || 0) - (a.time_played || 0);
      return 0;
    });

  const escalas = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const statuses = ["completed", "playing", "paused", "dropped", "wishlist"];

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

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Cargando colección...</div>;

  return (
    <div ref={mainRef} style={{ position: "relative", minHeight: "100%" }}>
      <fieldset style={{ padding: "20px", backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <style>{`
          .status-btn {
            padding: 4px 12px;
            cursor: pointer;
            text-transform: capitalize;
            transition: all 0.2s ease;
          }
          .status-btn.active {
            background: #e3e3e3 !important;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.25) !important;
            outline: none !important;
          }
          .reset-btn-narrow {
            background: none;
            border: none;
            cursor: default;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            transition: all 0.2s ease;
            opacity: 0.4;
            color: #d9534f;
            width: fit-content;
          }
          .reset-btn-narrow.active {
            cursor: pointer;
            opacity: 1;
          }
          
          .game-case-container {
            position: relative;
            cursor: pointer;
            perspective: 1000px;
            aspect-ratio: 3/4;
            z-index: 1;
          }

          .game-case {
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
            z-index: 10;
          }

          .game-case-container:hover {
            z-index: 20;
          }

          .game-case-container:hover .game-case {
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

          .game-case-container:hover .case-overlay-container {
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
            background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 49%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.6) 100%);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-top-color: rgba(255, 255, 255, 0.7); 
            border-bottom-color: rgba(0, 0, 0, 0.8);   
            border-radius: 6px;
            color: #fff;
            padding: 2px 4px;
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "15px", borderBottom: "1px solid #ccc", flexWrap: "wrap", gap: "15px" }}>
          
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {statuses.map((status) => (
              <button
                key={status}
                className={`status-btn ${filterStatus === status ? "active" : ""}`}
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="filterRating">Rating:</label>
              <select id="filterRating" value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
                <option value="all">Filter...</option>
                {escalas.map(nota => (
                  <option key={nota} value={nota}>{nota} ★</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="sortBy">Sort By:</label>
              <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="added_desc">When Added</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="time_desc">Most Played Time</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className={`reset-btn-narrow ${hasActiveFilters ? "active" : ""}`}
              title="Clear Filters"
              style={{ width: "40px", minWidth: "26px", height: "26px", minHeight: "26px", padding: 0, margin: 0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "none", border: "1px solid transparent", borderRadius: "3px" }}
            >
              <Eraser size={18} />
            </button>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "15px", paddingTop: "10px" }}>
          {processedGames.length > 0 ? (
            processedGames.map((juego) => (
              <div 
                key={juego.game_id} 
                className="game-case-container" 
                title={juego.games.title}
                onClick={() => {
                  setFocusedGame({
                    id: juego.game_id,
                    titulo: juego.games.title,
                    portada: juego.games.cover_image_url,
                    platform: juego.platform,
                    todasLasConsolas: juego.games.platforms
                  });
                  setIsLogging(true);
                }}
              >
                <div 
                  className="game-case" 
                  style={{ backgroundImage: `url(${juego.games.cover_image_url})` }}
                >
                  <div className="case-overlay-container">
                    
                    <div className="badges-row">
                      <div className="embedded-badge" title="Time Played" style={{ backgroundColor: getTimeColor(juego.time_played) }}>
                        <Clock size={16} />
                        <span>{juego.time_played ? `${juego.time_played}h` : "--h"}</span>
                      </div>
                      <div className="embedded-badge" title="Difficulty" style={{ backgroundColor: getDifficultyColor(juego.difficulty) }}>
                        <Dumbbell size={16} />
                        <span>{juego.difficulty || "Default"}</span>
                      </div>
                    </div>
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map((starIndex) => (
                        <span 
                          key={starIndex}
                          className={juego.rating && juego.rating >= starIndex ? "active" : ""}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#666", padding: "20px 0" }}>No se encontraron juegos con estos filtros.</p>
          )}
        </div>
      </fieldset>

      {focusedGame && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(5px)",
          zIndex: 100000, display: "flex", flexDirection: "column",
          justifyContent: "flex-end", alignItems: "center", paddingBottom: "30px" 
        }}>
          <div 
            className="info-float-god window" 
            style={{ 
              position: "fixed", 
              top: `calc(50vh + ${infoPos.y}px)`, 
              left: `calc(15% + ${infoPos.x}px)`, 
              width: "42px", height: "42px", 
              minWidth: "42px", minHeight: "42px", 
              padding: 0, 
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderTopColor: "rgba(255, 255, 255, 0.6)",
              borderRadius: "4px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.7)",
              zIndex: 110, 
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: draggingInfo ? "grabbing" : "grab",
              overflow: "hidden", 
              transform: "translate(-50%, -50%)", 
              transition: draggingInfo ? "none" : "box-shadow 0.2s ease"
            }}
            onPointerDown={(e) => { 
              e.preventDefault();
              setDraggingInfo(true); 
              isDraggingRef.current = false;
              
              const startClientX = e.clientX;
              const startClientY = e.clientY;
              const startInfoX = infoPos.x;
              const startInfoY = infoPos.y;

              const handleMove = (moveEvent: PointerEvent) => {
                isDraggingRef.current = true;
                setInfoPos({
                  x: startInfoX + (moveEvent.clientX - startClientX),
                  y: startInfoY + (moveEvent.clientY - startClientY)
                });
              };
              
              const handleUp = () => {
                setDraggingInfo(false);
                window.removeEventListener("pointermove", handleMove);
                window.removeEventListener("pointerup", handleUp);
                setTimeout(() => { isDraggingRef.current = false; }, 50);
              };
              
              window.addEventListener("pointermove", handleMove);
              window.addEventListener("pointerup", handleUp);
            }}
            onPointerOver={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(251, 191, 36, 0.7), inset 0 1px 1px rgba(255,255,255,0.8)";
              e.currentTarget.style.borderTopColor = "rgba(251, 191, 36, 0.8)";
            }}
            onPointerOut={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.7)";
              e.currentTarget.style.borderTopColor = "rgba(255, 255, 255, 0.6)";
            }}
          >
            <button 
              onClick={(e) => {
                if (isDraggingRef.current) return;
                router.push(`/game/${focusedGame.id}`);
              }} 
              style={{ 
                background: "transparent", border: "none", boxShadow: "none",
                color: "#1a1a2e", padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", height: "100%", cursor: draggingInfo ? "grabbing" : "pointer",
                margin: 0, 
              }}
              title="Descubrir la Ficha Técnica"
            >
              <style>{`
                .info-float-god:hover .rotate-icon {
                  transform: rotate(360deg) scale(1.1);
                  color: #fbbf24; 
                }
              `}</style>
              <div className="rotate-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.4s ease, color 0.4s ease", pointerEvents: "none" }}>
                <Share size={24} strokeWidth={3} filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))" />
              </div>
            </button>
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
                cargarJuegos();
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