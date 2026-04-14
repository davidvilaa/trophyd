"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { X, MoveLeft, MoveRight, House, FileEdit } from "lucide-react";
import GameCard3D from "@/components/gameCard3D";
import GameCaseCard from "@/components/cards/gameCard";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useNotification } from "@/components/NotificationProvider";

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { showNotification } = useNotification();

  useEffect(() => {
    const comprobarSesion = async () => {
      const { data: { user } } = await supabase.auth.getUser(); 
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    comprobarSesion();
  }, []);

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
                    style={{ flex: 1, height: `${Math.max(heightPercent, 2)}%` }} 
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
              <GameCaseCard 
                key={index}
                isEmpty={!fav}
                gameData={fav}
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
              />
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