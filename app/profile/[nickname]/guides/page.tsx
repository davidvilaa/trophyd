"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Clock, Dumbbell } from "lucide-react";

export default function ProfileGuidesPage() {
  const params = useParams();
  const router = useRouter();
  const targetNickname = params.nickname as string;

  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const cargarGuias = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setCurrentUserId(session.user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("nickname", targetNickname)
          .single();

        if (!profile) return;

        const { data: guidesData } = await supabase
          .from("guides")
          .select(`id, title, average_time, average_difficulty, cover_url, user_id, games (id, title, cover_image_url)`)
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (guidesData) setGuides(guidesData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (targetNickname) cargarGuias();
  }, [targetNickname]);

  const getDifficultyColor = (diff: number | null | undefined) => {
    if (!diff) return "rgba(20, 30, 40, 0.5)";
    const d = Math.round(Number(diff));
    if (d <= 3) return "rgba(21, 128, 61, 0.6)";
    if (d <= 5) return "rgba(101, 163, 13, 0.6)";
    if (d <= 7) return "rgba(202, 138, 4, 0.6)";
    if (d === 8) return "rgba(194, 65, 12, 0.6)";
    if (d === 9) return "rgba(185, 28, 28, 0.6)";
    return "rgba(127, 29, 29, 0.8)";
  };

  const getTimeColor = (hours: number | null | undefined) => {
    if (!hours) return "rgba(20, 30, 40, 0.5)"; 
    const h = Number(hours);
    if (h <= 5) return "rgba(21, 128, 61, 0.6)";
    if (h <= 10) return "rgba(101, 163, 13, 0.6)";
    if (h <= 30) return "rgba(202, 138, 4, 0.6)";
    if (h <= 50) return "rgba(217, 119, 6, 0.6)";
    if (h <= 80) return "rgba(194, 65, 12, 0.6)";
    if (h <= 100) return "rgba(154, 52, 18, 0.6)";
    if (h <= 300) return "rgba(185, 28, 28, 0.6)";
    return "rgba(127, 29, 29, 0.8)";
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Cargando guías...</div>;

  return (
    <fieldset style={{ padding: "20px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "0px" }}>
      <legend style={{ fontSize: "18px" }}>Published Guides</legend>
      <div style={{ display: "flex", alignItems: "center", paddingBottom: "10px", borderBottom: "0px solid #ccc" }}>
      </div>

      <style>{`
        .guide-case-container {
          position: relative;
          cursor: pointer;
          perspective: 1000px;
          aspect-ratio: 1/1; 
          z-index: 1;
        }

        .guide-case {
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

        .guide-case-container:hover {
          z-index: 20;
        }

        .guide-case-container:hover .guide-case {
          transform: rotateX(8deg) rotateY(-8deg) scale(1.1) translateZ(30px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3) !important;
        }

        /* --- GRADIENTE PARA EL TITULO (ABAJO) --- */
        .guide-info-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
          padding: 20px 10px 10px 10px;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 2px;
          z-index: 5;
        }

        /* --- BADGES (ARRIBA DEL TODO) --- */
        .guide-badges-area {
          position: absolute;
          top: 8px; /* Movidas arriba para consistencia */
          left: 0;
          right: 0;
          display: flex;
          flex-direction: row;
          justify-content: center;
          gap: 5px;
          padding: 0 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
          transform: translateZ(40px); /* Flotan sobre la carátula */
          transform-style: preserve-3d;
          z-index: 10;
        }

        .guide-case-container:hover .guide-badges-area {
          opacity: 1;
        }

        .embedded-badge {
          flex: 1 1 0%; 
          justify-content: center;
          background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 49%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.6) 100%);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-top-color: rgba(255, 255, 255, 0.7);
          border-bottom-color: rgba(0, 0, 0, 0.8);
          border-radius: 6px;
          color: #fff;
          padding: 2px 4px;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 3px rgba(0, 0, 0, 0.5), 0 4px 10px rgba(0, 0, 0, 0.6);
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 1px 2px rgba(0,0,0,0.9);
        }

        .embedded-badge svg {
          stroke-width: 2.5px;
          color: #fff;
          flex-shrink: 0;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.8));
        }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
        {guides.length > 0 ? (
          guides.map((guia) => (
            <div 
              key={guia.id} 
              className="guide-case-container" 
              title={guia.title}
              onClick={() => {
                if (currentUserId === guia.user_id) {
                  router.push(`/game/${guia.games.id}/write-guide?guideId=${guia.id}`);
                } else {
                  router.push(`/game/${guia.games.id}/guide/${guia.id}`);
                }
              }}
            >
              <div 
                className="guide-case" 
                style={{ backgroundImage: `url(${guia.cover_url || guia.games.cover_image_url})` }}
              >
                <div className="guide-badges-area">
                  <div className="embedded-badge" title="Difficulty" style={{ backgroundColor: getDifficultyColor(guia.average_difficulty) }}>
                    <Dumbbell size={16} />
                    <span>{guia.average_difficulty ? `${guia.average_difficulty}/10` : "--/10"}</span>
                  </div>
                  <div className="embedded-badge" title="Time" style={{ backgroundColor: getTimeColor(guia.average_time) }}>
                    <Clock size={16} />
                    <span>{guia.average_time ? `${guia.average_time}h` : "--h"}</span>
                  </div>
                </div>

                <div className="guide-info-gradient">
                  <div style={{ fontSize: "13px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={guia.title}>{guia.title}</div>
                  <div style={{ fontSize: "10px", color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={guia.games.title}>{guia.games.title}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#666", padding: "20px 0" }}>Aún no ha publicado ninguna guía.</p>
        )}
      </div>
    </fieldset>
  );
}