"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eraser, X, MoveLeft, MoveRight, House, FileEdit } from "lucide-react";
import GameCard3D from "@/components/gameCard3D";
import GameCaseCard from "@/components/cards/gameCard";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useNotification } from "@/components/NotificationProvider";

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

  const { showNotification } = useNotification();

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
              <GameCaseCard 
                key={juego.game_id}
                gameData={juego}
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
              />
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
            className="window glass active" 
            style={{ position: "absolute", top: "30px", width: "90%", maxWidth: "1100px", zIndex: 120 }}
          >
            <div className="title-bar">
              <div className="title-bar-text" style={{ fontSize: "14px" }}></div>
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
                showNotification(
                  action === "deleted" ? "¡Juego Borrado!" : "¡Juego Actualizado!",
                  action === "deleted" 
                    ? `Has eliminado ${focusedGame.titulo} de tu colección.` 
                    : `Has actualizado ${focusedGame.titulo} con éxito.`
                );
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
    </div>
  );
}