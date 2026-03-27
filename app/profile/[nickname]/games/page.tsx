"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileGamesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("title_asc");

  useEffect(() => {
    const cargarJuegos = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }

        const userId = session.user.id;

        const { data: allGamesData } = await supabase
          .from("user_games")
          .select(`
            *,
            games (
              title,
              cover_image_url
            )
          `)
          .eq("user_id", userId);

        if (allGamesData) {
          setAllGames(allGamesData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargarJuegos();
  }, [router]);

  const processedGames = allGames
    .filter((g) => filterStatus === "all" || g.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "title_asc") return a.games.title.localeCompare(b.games.title);
      if (sortBy === "title_desc") return b.games.title.localeCompare(a.games.title);
      if (sortBy === "rating_desc") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "time_desc") return (b.time_played || 0) - (a.time_played || 0);
      return 0;
    });

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Cargando colección...</div>;
  }

  return (
    <fieldset style={{ padding: "20px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "20px" }}>
      <legend style={{ fontSize: "18px" }}>Game Collection</legend>
      
      <div style={{ display: "flex", gap: "15px", alignItems: "center", paddingBottom: "15px", borderBottom: "1px solid #ccc" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="filterStatus">Status:</label>
          <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Games</option>
            <option value="playing">Playing</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="dropped">Dropped</option>
            <option value="wishlist">Wishlist</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="sortBy">Sort By:</label>
          <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="title_asc">Title (A-Z)</option>
            <option value="title_desc">Title (Z-A)</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="time_desc">Most Played Time</option>
          </select>
        </div>

        <div style={{ marginLeft: "auto", fontWeight: "bold", color: "#666" }}>
          Total: {processedGames.length}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "20px" }}>
        {processedGames.length > 0 ? (
          processedGames.map((juego) => (
            <div key={juego.game_id} className="game-card" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ 
                aspectRatio: "3/4", backgroundColor: "#e5e7eb", border: "2px inset #fff",
                backgroundImage: `url(${juego.games.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center",
                position: "relative"
              }}>
                {juego.rating && (
                  <div style={{ 
                    position: "absolute", bottom: "5px", right: "5px", 
                    backgroundColor: "rgba(0,0,0,0.8)", color: "#fbbf24", 
                    padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold"
                  }}>
                    ★ {juego.rating}
                  </div>
                )}
              </div>
              <div style={{ fontSize: "13px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={juego.games.title}>
                {juego.games.title}
              </div>
              <div style={{ fontSize: "11px", color: "#666", textTransform: "capitalize" }}>
                {juego.status}
              </div>
            </div>
          ))
        ) : (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#666", padding: "20px 0" }}>No se encontraron juegos con estos filtros.</p>
        )}
      </div>
    </fieldset>
  );
}