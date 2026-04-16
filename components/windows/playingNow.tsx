"use client";

import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { supabase } from "@/lib/supabase";
import { Gamepad2, Play, MoveLeft, MoveRight, House, FileEdit, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GameCaseCard from "@/components/cards/gameCard";
import GameCard3D from "@/components/gameCard3D";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useNotification } from "@/components/NotificationProvider";

export default function PlayingNow() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ nickname: string, pfp_url: string } | null>(null);
  const [stats, setStats] = useState({ completed: 0, playing: 0, paused: 0, wishlist: 0, dropped: 0, guides: 0 });
  const [playingGames, setPlayingGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const windowRef = useRef(null);
  const mainRef = useRef<HTMLDivElement>(null!);
  const router = useRouter();
  const { showNotification } = useNotification();

  const [focusedGame, setFocusedGame] = useState<any | null>(null);
  const [consolaFocus, setConsolaFocus] = useState<string | null>("pc");
  const [isLogging, setIsLogging] = useState(false);

  const fetchMyGames = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUser(user);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nickname, pfp_url")
        .eq("id", user.id)
        .single();
        
      if (profileData) {
        setUserProfile(profileData);
      }
      
      const { data, error } = await supabase
        .from("user_games")
        .select("*, games(id, title, cover_image_url, platforms)")
        .eq("user_id", user.id);

      const { count: guidesCount } = await supabase
        .from("guides")
        .select('*', { count: 'exact', head: true })
        .eq("user_id", user.id);

      if (!error && data) {
        let comp = 0, play = 0, paus = 0, wish = 0, drop = 0;
        const currentPlaying: any[] = [];

        data.forEach((g: any) => {
          if (g.status === "completed") comp++;
          else if (g.status === "playing") {
            play++;
            currentPlaying.push(g);
          }
          else if (g.status === "paused") paus++;
          else if (g.status === "wishlist") wish++;
          else if (g.status === "dropped") drop++;
        });

        setStats({ 
          completed: comp, 
          playing: play, 
          paused: paus, 
          wishlist: wish, 
          dropped: drop, 
          guides: guidesCount || 0 
        });
        
        setPlayingGames(currentPlaying.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMyGames();
  }, []);

  useEffect(() => {
    if (focusedGame) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [focusedGame]);

  return (
    <div ref={mainRef}>
      <Draggable handle=".title-bar" nodeRef={windowRef} defaultPosition={{ x: 0, y: 0 }}>
        <div 
          ref={windowRef} 
          className="window glass active" 
          style={{ width: "450px", position: "absolute", right: "50px", top: "50px", zIndex: 10 }}
        >
          <div className="title-bar" style={{ cursor: "grab" }}>
            <div className="title-bar-text" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Gamepad2 size={14} color="#4ade80" /> 
              Personal
            </div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>

          <div className="window-body has-space" style={{ margin: 0, padding: 0, backgroundColor: "#f3f4f6" }}>
            
            <div style={{ backgroundColor: "#fff", padding: "20px 20px 25px 20px" }}>
              
              {loading ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>Cargando...</div>
              ) : !user ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#666", fontSize: "13px" }}>
                  Inicia sesión para ver tus estadísticas y colección.
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "25px", lineHeight: "1.4" }}>
                    <div style={{ fontSize: "16px", color: "#111", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "5px" }}>
                      ¡Bienvenido, 
                      <Link href={`/profile/${userProfile?.nickname || ""}`} style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: "bold", color: "#0055cc", textDecoration: "none", cursor: "pointer" }} className="hover:underline">
                        {userProfile?.pfp_url ? (
                          <img 
                            src={userProfile.pfp_url} 
                            alt="Avatar" 
                            style={{ 
                              width: "18px", 
                              height: "18px", 
                              borderRadius: "2px",
                              objectFit: "cover", 
                              border: "1px solid #999",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                            }} 
                          />
                        ) : (
                          <div style={{ width: "18px", height: "18px", borderRadius: "2px", backgroundColor: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #999" }}>
                            <User size={12} color="#888" />
                          </div>
                        )}
                        {userProfile?.nickname || "Cazador"}
                      </Link>!
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                      Tu colección de juegos te espera.
                    </div>
                  </div>

                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(3, 1fr)", 
                    gap: "20px 10px", 
                    textAlign: "center"
                  }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>Completados</div>
                      <div style={{ fontSize: "28px", color: "#111", marginTop: "2px", fontWeight: "300" }}>{stats.completed}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>Jugando</div>
                      <div style={{ fontSize: "28px", color: "#111", marginTop: "2px", fontWeight: "300" }}>{stats.playing}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>Guías</div>
                      <div style={{ fontSize: "28px", color: "#111", marginTop: "2px", fontWeight: "300" }}>{stats.guides}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>Pausados</div>
                      <div style={{ fontSize: "28px", color: "#111", marginTop: "2px", fontWeight: "300" }}>{stats.paused}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>Wishlist</div>
                      <div style={{ fontSize: "28px", color: "#111", marginTop: "2px", fontWeight: "300" }}>{stats.wishlist}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>Abandonados</div>
                      <div style={{ fontSize: "28px", color: "#111", marginTop: "2px", fontWeight: "300" }}>{stats.dropped}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {user && (
              <div style={{ backgroundColor: "#f9fafb", borderTop: "1px solid #ddd" }}>
                
                <div style={{ padding: "15px 15px 0 15px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "#111", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Play size={18} color="#4a69bd" strokeWidth={2.5} /> Jugando Ahora
                  </h3>
                </div>
                
                <div style={{ padding: "0", minHeight: "150px" }}>
                  {playingGames.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "12px" }}>
                      No tienes juegos a medias. ¡Empieza uno nuevo!
                    </div>
                  ) : (
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "row",
                      overflowX: "auto",
                      overflowY: "hidden",
                      gap: "20px",
                      padding: "15px 20px 25px 20px"
                    }}>
                      {playingGames.map((juego) => (
                        <div key={juego.game_id} style={{ flex: "0 0 140px" }}>
                          <GameCaseCard 
                            gameData={{
                              ...juego,
                              games: juego.games
                            }}
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </Draggable>

      {focusedGame && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(5px)",
          zIndex: 100000, display: "flex", flexDirection: "column",
          justifyContent: "flex-end", alignItems: "center", paddingBottom: "30px" 
        }}>
          
          <div className="window glass active" style={{ position: "absolute", top: "30px", width: "90%", maxWidth: "1100px", zIndex: 120 }}>
            <div className="title-bar">
              <div className="title-bar-text" style={{ fontSize: "14px" }}>Editando: {focusedGame.titulo}</div>
              <div className="title-bar-controls">
                <button aria-label="Close" onClick={() => { setFocusedGame(null); setIsLogging(false); fetchMyGames(); }}></button>
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
              userId={user?.id}
              onPlatformFetched={(plat) => setConsolaFocus(plat)}
              onSaveSuccess={(action) => {
                setIsLogging(false); 
                setFocusedGame(null);
                fetchMyGames(); 
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
                  style={{ width: "35px", height: "100%", cursor: "pointer", padding: 0, margin: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <MoveLeft size={18} />
                </button>

                <select 
                  value={consolaFocus || "pc"} 
                  onChange={(e) => setConsolaFocus(e.target.value)}
                  style={{ width: "160px", height: "100%", cursor: "pointer", padding: "0 10px", margin: 0, borderRadius: 0 }}
                >
                  {focusedGame.todasLasConsolas && focusedGame.todasLasConsolas.length > 0 ? (
                    focusedGame.todasLasConsolas.map((c: string) => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
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
                  style={{ width: "35px", height: "100%", cursor: "pointer", padding: 0, margin: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <MoveRight size={18} />
                </button>
              </div>

              <button 
                onClick={() => router.push(`/game/${focusedGame.id}`)}
                style={{ minWidth: "35px", height: "35px", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Ver Ficha Técnica"
              >
                <House size={18} />
              </button>

              <button 
                onClick={() => setIsLogging(!isLogging)}
                className={isLogging ? "active" : ""}
                style={{ minWidth: "35px", height: "35px", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isLogging ? "#e3e3e3" : "", boxShadow: isLogging ? "inset 0 2px 4px rgba(0,0,0,0.25)" : "" }}
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