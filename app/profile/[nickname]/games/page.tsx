"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eraser } from "lucide-react";

export default function ProfileGamesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetNickname = params.nickname as string;

  const [loading, setLoading] = useState(true);
  const [allGames, setAllGames] = useState<any[]>([]);
  
  const [filterStatus, setFilterStatus] = useState("completed");
  
  const ratingFromUrl = searchParams.get("rating");
  const [filterRating, setFilterRating] = useState(ratingFromUrl || "all");
  
  const [sortBy, setSortBy] = useState("added_desc");

  useEffect(() => {
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
          .select(`*, games (title, cover_image_url)`)
          .eq("user_id", profile.id);

        if (allGamesData) setAllGames(allGamesData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (targetNickname) cargarJuegos();
  }, [targetNickname]);

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
    <fieldset style={{ padding: "20px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "20px" }}>
      <legend style={{ fontSize: "18px" }}>Game Collection</legend>
      
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
        }
        .reset-btn-narrow.active {
          cursor: pointer;
          opacity: 1;
        }
        .reset-btn-narrow:focus-visible {
          outline: 1px dotted #000 !important;
          outline-offset: -3px !important;
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
          >
            <Eraser size={18} />
          </button>
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "20px" }}>
        {processedGames.length > 0 ? (
          processedGames.map((juego) => (
            <div key={juego.game_id} className="game-card" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ aspectRatio: "3/4", backgroundColor: "#e5e7eb", border: "2px inset #fff", backgroundImage: `url(${juego.games.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                {juego.rating && <div style={{ position: "absolute", bottom: "5px", right: "5px", backgroundColor: "rgba(0,0,0,0.8)", color: "#fbbf24", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>★ {juego.rating}</div>}
              </div>
              <div style={{ fontSize: "13px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={juego.games.title}>{juego.games.title}</div>
              <div style={{ fontSize: "11px", color: "#666", textTransform: "capitalize" }}>{juego.status}</div>
            </div>
          ))
        ) : (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#666", padding: "20px 0" }}>No se encontraron juegos con estos filtros.</p>
        )}
      </div>
    </fieldset>
  );
}