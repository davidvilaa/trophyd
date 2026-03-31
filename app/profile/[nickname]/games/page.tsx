"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eraser, Clock, Dumbbell } from "lucide-react";

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
        
        .game-case-container {
          position: relative;
          cursor: pointer;
          perspective: 1000px;
          aspect-ratio: 3/4;
          z-index: 1;
        }

        .game-case {
          width: 100%;
          height: 100%;
          position: relative;
          background-size: cover;
          background-position: center;
          border: 2px inset #fff;
          background-color: #e5e7eb;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transform-style: preserve-3d;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
        }

        .game-case-container:hover {
          z-index: 20;
        }

        .game-case-container:hover .game-case {
          transform: rotateX(8deg) rotateY(-8deg) scale(1.15) translateZ(30px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3) !important;
        }

        .badges-area {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%) translateZ(50px);
          width: 115%;
          display: flex;
          flex-direction: row;
          justify-content: center;
          gap: 5px;
          opacity: 0;
          transition: opacity 0.2s ease;
          transform-style: preserve-3d;
        }

        .game-case-container:hover .badges-area {
          opacity: 1;
        }

        .embedded-badge {
          flex: 1;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.7);
          color: #fff;
          padding: 3px 4px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 5px rgba(0,0,0,0.4);
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .embedded-badge svg {
          stroke-width: 2.5px;
          color: #e3e3e3;
          flex-shrink: 0;
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
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1px" }}>
        {processedGames.length > 0 ? (
          processedGames.map((juego) => (
            <div key={juego.game_id} className="game-case-container" title={juego.games.title}>
              <div 
                className="game-case" 
                style={{ backgroundImage: `url(${juego.games.cover_image_url})` }}
              >
                <div className="badges-area">
                  <div className="embedded-badge" title="Time Played">
                    <Clock size={16} />
                    <span>{juego.time_played ? `${juego.time_played}h` : "--h"}</span>
                  </div>
                  <div className="embedded-badge" title="Difficulty">
                    <Dumbbell size={16} />
                    <span>{juego.difficulty || "Default"}</span>
                  </div>
                  <div className="embedded-badge" title="Rating">
                    <span>{juego.rating ? `★ ${juego.rating}` : "★ --"}</span>
                  </div>
                </div>
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