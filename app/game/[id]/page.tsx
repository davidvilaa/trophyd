"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;

  const [loading, setLoading] = useState(true);
  
  const [gameData, setGameData] = useState<any>({
    title: "Cargando Título...",
    cover_image_url: "",
    banner_url: "",
    summary: "Cargando información del juego...",
  });

  const distribucionNotas = { 1: 2, 2: 5, 3: 15, 4: 25, 5: 10 };
  const distribucionDificultad = { 2: 1, 4: 5, 6: 20, 8: 15, 10: 2 };

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

    fetchGameInfo();
  }, [gameId]);

  if (loading) return <div style={{ padding: "50px", textAlign: "center" }}>Cargando datos del juego...</div>;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", paddingBottom: "50px" }}>
      
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
          
          <div style={{ 
            width: "100%", aspectRatio: "3/4", backgroundColor: "#e5e7eb",
            border: "4px solid #fff", borderRadius: "2px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            backgroundImage: gameData.cover_image_url ? `url(${gameData.cover_image_url})` : "none",
            backgroundSize: "cover", backgroundPosition: "center"
          }}>
            {!gameData.cover_image_url && (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "3rem" }}>
                🖼️
              </div>
            )}
          </div>
        <fieldset style={{ padding: "15px", backgroundColor: "#fff", border: "1px solid #ccc", display: "flex", flexDirection: "column", gap: "15px" }}>
            <legend style={{ fontSize: "16px", padding: "0 5px" }}>Ratings</legend>
            
            <div>
              <div style={{ fontSize: "13px", marginBottom: "5px" }}>nota media: 3.9</div>
              <div style={{ display: "flex", alignItems: "flex-end", height: "80px", gap: "4px", borderBottom: "1px solid #ccc" }}>
                {Object.entries(distribucionNotas).map(([nota, count]) => (
                  <div key={nota} style={{ flex: 1, backgroundColor: "#2e7d32", height: `${(count / 25) * 100}%`, transition: "height 0.3s" }} title={`${nota}★: ${count} votos`}></div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "13px", marginBottom: "5px" }}>dificultad media: 7/10</div>
              <div style={{ display: "flex", alignItems: "flex-end", height: "80px", gap: "4px", borderBottom: "1px solid #ccc" }}>
                {Object.entries(distribucionDificultad).map(([diff, count]) => (
                  <div key={diff} style={{ flex: 1, backgroundColor: "#2e7d32", height: `${(count / 20) * 100}%`, transition: "height 0.3s" }} title={`Dificultad ${diff}: ${count} votos`}></div>
                ))}
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

          <fieldset style={{ padding: "20px", backgroundColor: "#fff", border: "1px solid #ccc" }}>
            <legend style={{ fontSize: "16px", padding: "0 5px" }}>Guides</legend>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "15px" }}>
              {[1, 2, 3].map((guia) => (
                <div key={guia} style={{ aspectRatio: "1/1", backgroundColor: "#e5e7eb", border: "2px inset #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "2rem" }}>
                  🖼️
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        <div style={{ width: "260px", flexShrink: 0, marginTop: "100px" }}>
          <fieldset style={{ padding: "15px", backgroundColor: "#fff", border: "1px solid #ccc" }}>
            <legend style={{ fontSize: "16px", padding: "0 5px" }}>Following</legend>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              
              {[1, 2, 3].map((user) => (
                <div key={user} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "40px", height: "40px", backgroundColor: "#ccc", border: "2px inset #fff" }}></div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>Usuario {user}</span>
                    <span style={{ color: "#fbbf24", fontSize: "12px", textShadow: "0 0 1px rgba(0,0,0,0.5)" }}>★ ★ ★ ☆ ☆</span>
                  </div>
                </div>
              ))}

            </div>
          </fieldset>
        </div>
      </div>
    </main>
  );
}