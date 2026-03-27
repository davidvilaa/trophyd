"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileContentPage() {
  const params = useParams();
  const targetNickname = params.nickname as string;
  
  const [loading, setLoading] = useState(true);
  const [notaMedia, setNotaMedia] = useState(0);
  const [distribucionNotas, setDistribucionNotas] = useState<Record<number, number>>({
    0.5: 0, 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0
  });
  const [maxNotaCount, setMaxNotaCount] = useState(1);
  const [favoritos, setFavoritos] = useState<any[]>([]);

  useEffect(() => {
    const cargarDatosPerfil = async () => {
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("nickname", targetNickname)
          .single();

        if (!profile) return;

        const userId = profile.id;

        const { data: ratingsData } = await supabase
          .from("user_games")
          .select("rating")
          .eq("user_id", userId)
          .not("rating", "is", null);

        if (ratingsData && ratingsData.length > 0) {
          let suma = 0;
          let counts: Record<number, number> = { 0.5: 0, 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0 };

          ratingsData.forEach((row) => {
            const nota = Number(row.rating);
            suma += nota;
            const bucket = Math.round(nota * 2) / 2;
            if (counts[bucket] !== undefined) counts[bucket] += 1;
          });

          setNotaMedia(Number((suma / ratingsData.length).toFixed(1)));
          setDistribucionNotas(counts);
          setMaxNotaCount(Math.max(...Object.values(counts), 1));
        }

        const { data: favsData } = await supabase
          .from("user_games")
          .select(`game_id, games (title, cover_image_url)`)
          .eq("user_id", userId)
          .eq("isFavorite", true)
          .limit(5);

        if (favsData) setFavoritos(favsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (targetNickname) cargarDatosPerfil();
  }, [targetNickname]);

  const favoritosMostrados = Array(5).fill(null).map((_, index) => favoritos[index] || null);

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Cargando estadísticas...</div>;

  return (
    <div style={{ display: "flex", gap: "30px", alignItems: "stretch" }}>
      <fieldset style={{ width: "260px", padding: "20px", display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
        <legend style={{ fontSize: "18px" }}>Ratings</legend>
        <p style={{ margin: "0 0 25px 0", fontWeight: "bold", textAlign: "center", fontSize: "18px" }}>
          Nota media: {notaMedia > 0 ? notaMedia : "--"}
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "120px", marginTop: "auto", borderBottom: "2px solid #888", paddingBottom: "2px", gap: "2px" }}>
          {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((estrella) => {
            const heightPercent = maxNotaCount > 0 ? (distribucionNotas[estrella] / maxNotaCount) * 100 : 0;
            return (
              <div key={estrella} style={{ flex: 1, height: `${Math.max(heightPercent, 2)}%`, backgroundColor: "#16a34a", transition: "height 0.5s ease-out" }} title={`${estrella} Estrellas: ${distribucionNotas[estrella]} juegos`}></div>
            );
          })}
        </div>
      </fieldset>

      <fieldset style={{ flex: 1, padding: "20px", backgroundColor: "#fff" }}>
        <legend style={{ fontSize: "18px" }}>Favorite Games</legend>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px" }}>
          {favoritosMostrados.map((fav, index) => (
            <div key={index} className={fav ? "game-card" : ""} style={{ aspectRatio: "3/4", backgroundColor: "#e5e7eb", border: "2px inset #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "2rem", backgroundImage: fav ? `url(${fav.games.cover_image_url})` : "none", backgroundSize: "cover", backgroundPosition: "center" }}>
              {!fav && "🖼️"}
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
}