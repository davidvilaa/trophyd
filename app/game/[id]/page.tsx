"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Clock, Dumbbell, Award} from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { PresentationControls, Environment, ContactShadows } from "@react-three/drei";
import GameCard3D from "@/components/gameCard3D";
import { View } from "@react-three/drei";
import { useNotification } from "@/components/NotificationProvider";
import GuideCaseCard from "@/components/cards/guideCard";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const mainRef = useRef<HTMLElement>(null!);

  const [loading, setLoading] = useState(true);
  
  const [gameData, setGameData] = useState<any>({
    title: "Cargando Título...",
    cover_image_url: "",
    banner_url: "",
    summary: "Cargando información del juego...",
  });

  const [stats, setStats] = useState({
    avgRating: 0,
    avgDifficulty: 0,
    avgTime: 0,
    distRating: { 0.5: 0, 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0 } as Record<number, number>,
    distDiff: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 } as Record<number, number>,
    maxRatingCount: 1,
    maxDiffCount: 1
  });

  const [guides, setGuides] = useState<any[]>([]);

  const [followingVotes, setFollowingVotes] = useState<any[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchGameInfo = async () => {
      if (!gameId) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/igdb/game?id=${gameId}`);
        if (res.ok) {
          const data = await res.json();
          setGameData(data);
        } else {
          console.error("Error al obtener datos del juego de IGDB");
        }
      } catch (error) {
        console.error("Error de red:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchGameStats = async () => {
      if (!gameId) return;
      try {
        const { data, error } = await supabase
          .from("user_games")
          .select("rating, difficulty, time_played")
          .eq("game_id", gameId);

        if (data && data.length > 0) {
          let rSum = 0, rCount = 0;
          let dSum = 0, dCount = 0;
          let tSum = 0, tCount = 0;
          
          const rDist: Record<number, number> = { 0.5: 0, 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0 };
          const dDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
          
          data.forEach(row => {
            if (row.rating > 0) {
              rSum += Number(row.rating);
              rCount++;
              const rBucket = Math.round(Number(row.rating) * 2) / 2; 
              if (rDist[rBucket] !== undefined) rDist[rBucket]++;
            }
            if (row.difficulty > 0) {
              dSum += Number(row.difficulty);
              dCount++;
              const dBucket = Math.round(Number(row.difficulty)); 
              if (dDist[dBucket] !== undefined) dDist[dBucket]++;
            }
            if (row.time_played > 0) {
              tSum += Number(row.time_played);
              tCount++;
            }
          });

          setStats({
            avgRating: rCount > 0 ? Number((rSum / rCount).toFixed(1)) : 0,
            avgDifficulty: dCount > 0 ? Number((dSum / dCount).toFixed(1)) : 0,
            avgTime: tCount > 0 ? Math.round(tSum / tCount) : 0,
            distRating: rDist,
            distDiff: dDist,
            maxRatingCount: Math.max(...Object.values(rDist), 1),
            maxDiffCount: Math.max(...Object.values(dDist), 1),
          });
        }
      } catch (error) {
        console.error("Error obteniendo stats de Supabase:", error);
      }
    };

    const fetchGuides = async () => {
      if (!gameId) return;
      try {
        const { data } = await supabase
          .from("guides")
          .select(`id, title, average_time, average_difficulty, cover_url, user_id, profiles!guides_user_id_fkey (nickname)`)
          .eq("game_id", gameId)
          .order("created_at", { ascending: false });

        if (data) setGuides(data);
      } catch (error) {
        console.error("Error obteniendo guías:", error);
      }
    };

    const fetchFollowingVotes = async () => {
      if (!gameId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        if (!user) {
          return;
        }

        const { data: follows, error: followError } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        if (followError) {
          console.error("Error en tabla follows:", followError.message);
          return;
        }

        if (!follows || follows.length === 0) {
          setFollowingVotes([]);
          return;
        }

        const followingIds = follows.map(f => f.following_id);

        const { data: votes, error: voteError } = await supabase
          .from("user_games")
          .select(`
            rating,
            profiles!user_id (
              id,
              nickname,
              pfp_url
            )
          `)
          .eq("game_id", Number(gameId)) 
          .in("user_id", followingIds);

        if (voteError) {
          console.error("Error en query user_games:", voteError.message);
          return;
        }

        setFollowingVotes(votes || []);

      } catch (error: any) {
        console.error("Error catastrófico en Following:", error.message || error);
      }
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUserId(session.user.id);
    };
    
    getSession();
    fetchGameInfo();
    fetchGameStats();
    fetchGuides();
    fetchFollowingVotes();
  }, [gameId]);

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Cargando datos del juego...</div>;

  const escalasRating = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const escalasDiff = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <main ref={mainRef} style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", paddingBottom: "50px" }}>
      
      <div 
        style={{ 
          width: "100%", height: "350px", backgroundColor: "#d1d5db",
          backgroundImage: gameData.banner_url ? `url(${gameData.banner_url})` : "none",
          backgroundSize: "cover", 
          backgroundPosition: "center 25%",
          borderBottom: "1px solid #ccc"
        }}
      >
        {!gameData.banner_url && (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "4rem" }}>
            🖼️
          </div>
        )}
      </div>

      <div style={{ 
        maxWidth: "1200px", margin: "0 auto", padding: "0 20px",
        display: "flex", gap: "30px", alignItems: "flex-start",
        position: "relative", top: "-100px"
      }}>

        <div style={{ width: "240px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ width: "100%", aspectRatio: "3/4", position: "relative", cursor: "pointer", zIndex: 10 }}>
            {gameData.cover_image_url ? (
              <GameCard3D
                coverUrl={gameData.cover_image_url}
                consola="pc" 
                isFocused={false}
                onClick={() => {
                  console.log("¡Click en el 3D! Aquí abriremos el modal para loguear.");
                }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", border: "4px solid #fff", backgroundColor: "#ccc" }} />
            )}
          </div>
        <fieldset style={{ padding: "15px", backgroundColor: "#fff", border: "1px solid #ccc", display: "flex", flexDirection: "column", gap: "25px" }}>
            <legend style={{ fontSize: "16px", padding: "0 5px" }}>Community Stats</legend>
            
            <style>{`
              .stat-bar {
                transition: height 0.5s ease-out, background-color 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
                cursor: pointer;
                position: relative;
                transform-origin: bottom;
              }
              .stat-bar:hover {
                transform: scaleX(1.15) scaleY(1.1);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 10;
              }
              .stat-bar.rating { background-color: #81c784; }
              .stat-bar.rating:hover { background-color: #2e7d32; }
              .stat-bar.diff { background-color: #e57373; }
              .stat-bar.diff:hover { background-color: #b91c1c; }
            `}</style>

            <div>
              <div style={{ textAlign: "center", marginBottom: "15px" }}>
                <span style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>Nota media</span>
                <div style={{ fontSize: "28px", color: "#111", marginTop: "2px" }}>
                  {stats.avgRating > 0 ? `${stats.avgRating} ★` : "--"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", height: "80px", gap: "4px", borderBottom: "1px solid #ccc", paddingBottom: "2px" }}>
                {escalasRating.map((nota) => {
                  const count = stats.distRating[nota] || 0;
                  const altura = stats.maxRatingCount > 0 ? (count / stats.maxRatingCount) * 100 : 0;
                  return (
                    <div 
                      key={nota} 
                      className="stat-bar rating"
                      onClick={() => console.log(`Futuro filtro de usuarios por nota: ${nota}`)}
                      style={{ flex: 1, height: `${Math.max(altura, 2)}%` }} 
                      title={`${nota}★: ${count} votos`}
                    ></div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666", marginTop: "4px" }}>
                <span>1★</span><span>5★</span>
              </div>
            </div>

            <div>
              <div style={{ textAlign: "center", marginBottom: "15px" }}>
                <span style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>Dificultad media</span>
                <div style={{ fontSize: "28px", color: "#111", marginTop: "2px" }}>
                  {stats.avgDifficulty > 0 ? `${stats.avgDifficulty}/10` : "--/10"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", height: "80px", gap: "4px", borderBottom: "1px solid #ccc", paddingBottom: "2px" }}>
                {escalasDiff.map((diff) => {
                  const count = stats.distDiff[diff] || 0;
                  const altura = stats.maxDiffCount > 0 ? (count / stats.maxDiffCount) * 100 : 0;
                  return (
                    <div 
                      key={diff} 
                      className="stat-bar diff"
                      onClick={() => console.log(`Futuro filtro de usuarios por dificultad: ${diff}`)}
                      style={{ flex: 1, height: `${Math.max(altura, 2)}%` }} 
                      title={`Dificultad ${diff}/10: ${count} votos`}
                    ></div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666", marginTop: "4px" }}>
                <span>1</span><span>10</span>
              </div>
            </div>

            <div style={{ textAlign: "center", paddingTop: "5px", borderTop: "1px solid #eee" }}>
              <span style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>Tiempo medio</span>
              <div style={{ fontSize: "28px", color: "#111", marginTop: "2px" }}>
                {stats.avgTime > 0 ? `${stats.avgTime}h` : "--h"}
              </div>
            </div>

          </fieldset>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", marginTop: "100px"}}>
          
          <div style={{ backgroundColor: "#fff", padding: "20px", border: "1px solid #ccc", minHeight: "150px" }}>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#333" }}>
              {gameData.summary}
            </p>
          </div>

          <fieldset style={{ padding: "20px", backgroundColor: "#fff", border: "1px solid #ccc", minHeight: "250px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              <legend style={{ fontSize: "18px", padding: "0 5px", margin: 0 }}>Guías de la Comunidad ({guides.length})</legend>
              <button 
                className="default aero-btn-list"
                onClick={() => {
                  if (!currentUserId) {
                    showNotification("Debes iniciar sesión para escribir una guía.", "info");
                    return;
                  }
                  router.push(`/game/${gameId}/write-guide`);
                }}
                style={{ padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
              >
                + Escribir Guía
              </button>
            </div>

            {guides.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
                {guides.map((guia) => (
                  <GuideCaseCard
                    key={guia.id}
                    guideData={guia}
                    subtitle={`Por: ${guia.profiles?.nickname || "Desconocido"}`}
                    onClick={() => {
                      if (currentUserId === guia.user_id) {
                        router.push(`/game/${gameId}/write-guide?guideId=${guia.id}`);
                      } else {
                        router.push(`/game/${gameId}/guide/${guia.id}`);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                <p style={{ margin: 0 }}>Nadie ha escrito una guía para este juego todavía.</p>
              </div>
            )}

          </fieldset>
        </div>

        <div style={{ width: "260px", flexShrink: 0, marginTop: "100px" }}>
          <fieldset style={{ padding: "15px", backgroundColor: "#fff", border: "1px solid #ccc", minHeight: "200px" }}>
            
            <style>{`
              .user-card {
                transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
                cursor: pointer;
                position: relative;
                padding: 8px; 
                margin-bottom: 12px;
              }
              .user-card:hover { 
                transform: scale(1.05); 
                box-shadow: 0 10px 20px rgba(0,0,0,0.25) !important;
                z-index: 10;
              }
            `}</style>

            <div style={{ display: "flex", flexDirection: "column", marginTop: "10px" }}>
              {followingVotes.length > 0 ? (
                followingVotes.map((vote, index) => (
                  <div 
                    key={index} 
                    className="window user-card"
                    onClick={() => router.push(`/profile/${vote.profiles.nickname}`)}
                  >
                    <div className="window-body" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "12px", margin: 0 }}>
                      
                      <div 
                        style={{ 
                          width: "45px", height: "45px", flexShrink: 0, 
                          border: "2px inset #fff", backgroundColor: "#ccc", 
                          backgroundImage: `url(${vote.profiles.pfp_url || 'https://www.gravatar.com/avatar/0?d=mp&f=y'})`, 
                          backgroundSize: "cover", backgroundPosition: "center" 
                        }}
                      ></div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, overflow: "hidden" }}>
                        <span style={{ 
                          fontWeight: "bold", fontSize: "15px", 
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
                        }}>
                          {vote.profiles.nickname}
                        </span>
                        
                        <div style={{ color: "#fbbf24", fontSize: "13px", letterSpacing: "1px", textShadow: "0 1px 1px rgba(0,0,0,0.2)" }}>
                          {"★".repeat(Math.floor(vote.rating))}
                          {vote.rating % 1 !== 0 ? "½" : ""}
                          <span style={{ color: "#ccc" }}>{"★".repeat(5 - Math.ceil(vote.rating))}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px 10px", color: "#888", fontSize: "13px" }}>
                  Ninguno de tus amigos ha logueado este juego todavía.
                </div>
              )}
            </div>
          </fieldset>
        </div>
      </div>
      <Canvas
        eventSource={mainRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 10 }}
        camera={{ position: [0, 0, 22], fov: 20 }}
      >
        <View.Port />
      </Canvas>
    </main>
  );
}