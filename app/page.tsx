"use client";

import { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Activity, Trophy, Clock } from "lucide-react";

export default function Home() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const feedRef = useRef(null);

  useEffect(() => {
    const fetchFeed = async () => {
      const { data, error } = await supabase
        .from('user_games')
        .select(`
          user_id,
          game_id,
          status,
          created_at,
          profiles ( nickname ),
          games ( id, title, cover_image_url )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error cargando el feed:", error);
      } else if (data) {
        setFeed(data);
      }
      setLoading(false);
    };

    fetchFeed();
  }, []);

  return (
    <main className="min-h-screen bg-[url('https://wallpapers.com/images/hd/artistic-blue-windows-7-cover-v0qwgn3ypat2bloy.jpg')] bg-cover bg-center bg-fixed overflow-hidden relative">
      <Draggable handle=".title-bar" nodeRef={feedRef} defaultPosition={{ x: 50, y: 50 }}>
        <div 
          ref={feedRef} 
          className="window glass active" 
          style={{ width: "380px", position: "absolute", zIndex: 10 }}
        >
          <div className="title-bar" style={{ cursor: "grab" }}>
            <div className="title-bar-text" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Activity size={14} /> Feed Global de Trophyd
            </div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>

          <div className="window-body has-space" style={{ margin: 0, padding: "10px", maxHeight: "400px", overflowY: "auto" }}>
            
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#333" }}>Cargando actividad... ⏳</div>
            ) : feed.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#666", fontSize: "12px" }}>
                Aún no hay actividad en la red. ¡Sé el primero!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {feed.map((item, index) => {
                  if (!item.profiles || !item.games) return null;
                  const uniqueKey = `${item.user_id}-${item.game_id}`;

                  return (
                    <div 
                      key={uniqueKey} 
                      style={{ 
                        display: "flex", gap: "10px", alignItems: "center", 
                        padding: "8px", backgroundColor: "rgba(255,255,255,0.6)", 
                        border: "1px solid rgba(0,0,0,0.1)", borderRadius: "4px",
                        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.8)"
                      }}
                    >
                      <div style={{ width: "40px", height: "55px", flexShrink: 0, backgroundColor: "#000", border: "1px solid #333", overflow: "hidden" }}>
                        {item.games.cover_image_url ? (
                          <img src={item.games.cover_image_url} alt={item.games.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>🎮</div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>
                          <Link href={`/profile/${item.profiles.nickname}`} style={{ fontWeight: "bold", color: "#0066cc", textDecoration: "none" }}>
                            {item.profiles.nickname}
                          </Link>
                          {" "}ha {item.status === 'completed' ? 'completado' : 'añadido'}:
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: "bold", color: "#000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Link href={`/game/${item.games.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                            {item.games.title}
                          </Link>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", fontSize: "10px", color: item.status === 'completed' ? "#15803d" : "#b45309", fontWeight: "bold" }}>
                          {item.status === 'completed' ? <Trophy size={10} /> : <Clock size={10} />}
                          {item.status === 'completed' ? 'Completado' : 'Jugando'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="status-bar" style={{ margin: 0 }}>
            <p className="status-bar-field">Actividades: {feed.length}</p>
            <p className="status-bar-field">Actualizado en tiempo real</p>
          </div>

        </div>
      </Draggable>
    </main>
  );
}