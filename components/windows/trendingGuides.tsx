"use client";

import { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { supabase } from "@/lib/supabase";
import { Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import GuideCaseCard from "@/components/cards/guideCard";

export default function TrendingWindow() {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const windowRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("guides")
          .select(`
            id, 
            title, 
            average_time, 
            average_difficulty,
            cover_url, 
            user_id,
            game_id,
            games ( id, title, cover_image_url ),
            profiles!guides_user_id_fkey (nickname),
            guide_likes (user_id)
          `);

        if (error) throw error;

        if (data) {
          const processed = data.map((g: any) => ({
            ...g,
            likesCount: g.guide_likes ? g.guide_likes.length : 0
          }));

          const sorted = processed.sort((a, b) => b.likesCount - a.likesCount);
          setTrending(sorted.slice(0, 10)); 
        }
      } catch (error) {
        console.error("Error cargando trending:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <Draggable handle=".title-bar" nodeRef={windowRef} defaultPosition={{ x: 550, y: 100 }}>
      <div 
        ref={windowRef} 
        className="window glass active" 
        style={{ width: "600px", position: "absolute", zIndex: 10 }}
      >
        <div className="title-bar" style={{ cursor: "grab" }}>
          <div className="title-bar-text" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Flame size={14} color="#ff7b00" style={{ filter: "drop-shadow(0 0 2px rgba(255,123,0,0.8))" }} /> 
            Top Guías de la Comunidad
          </div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>

        <div className="window-body has-space" style={{ margin: 0, padding: 0, backgroundColor: "#f3f4f6" }}>
          
          <div style={{ 
            padding: "15px", 
            borderBottom: "1px solid #ccc", 
            backgroundColor: "#fff",
            backgroundImage: "linear-gradient(to bottom, #fff 0%, #f9fafb 100%)"
          }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#111", display: "flex", alignItems: "center", gap: "8px" }}>
              <Flame size={20} color="#dc2626" /> 
              Las guías más votadas
            </h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
              Descubre qué están usando otros jugadores para pasarse sus juegos.
            </p>
          </div>
          
          <div style={{ padding: "15px", maxHeight: "450px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>Buscando las mejores guías... ⏳</div>
            ) : trending.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "12px" }}>
                Aún no hay guías suficientes.
              </div>
            ) : (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", 
                gap: "20px",
                padding: "5px"
              }}>
                {trending.map((guia, index) => (
                  <div key={guia.id} style={{ position: "relative" }}>
                    
                    <div style={{
                      position: "absolute",
                      top: "-10px",
                      left: "-10px",
                      width: "28px",
                      height: "28px",
                      backgroundColor: index === 0 ? "#fbbf24" : index === 1 ? "#94a3b8" : index === 2 ? "#b45309" : "#334155",
                      color: "#fff",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                      zIndex: 30,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      border: "2px solid #fff"
                    }}>
                      {index + 1}
                    </div>

                    <GuideCaseCard 
                      guideData={guia} 
                      subtitle={`${guia.games?.title} • Por: ${guia.profiles?.nickname}`}
                      onClick={() => router.push(`/game/${guia.game_id}/guide/${guia.id}`)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="status-bar" style={{ margin: 0 }}>
          <p className="status-bar-field">Mostrando el Top 10 Global</p>
        </div>
      </div>
    </Draggable>
  );
}