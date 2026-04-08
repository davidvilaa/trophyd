"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { ArrowLeft, Clock, Dumbbell, Award, CheckSquare, Square } from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";

export default function GuideReadingPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const guideId = params.guideId as string;

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>({ title: "Cargando...", banner_url: "" });
  const [guideData, setGuideData] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [markedChecks, setMarkedChecks] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  const { showNotification } = useNotification();

  const sanitizeSchema = {
    tagNames: ['u', 'br', 'strong', 'em', 'p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'img', 'a'],
    attributes: {
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'title', 'width', 'height']
    }
  };

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let userId = session?.user?.id || null;
        if (userId) setCurrentUserId(userId);

        const res = await fetch(`/api/igdb/game?id=${gameId}`);
        if (res.ok) setGameData(await res.json());

        const { data: guide, error: guideErr } = await supabase
          .from("guides")
          .select("*, profiles!guides_user_id_fkey(nickname)")
          .eq("id", guideId)
          .maybeSingle();

        if (guideErr) throw guideErr;
        if (guide) setGuideData(guide);

        const { data: secs, error: secsErr } = await supabase
          .from("guide_sections")
          .select(`id, title, text, checklist (id, text)`)
          .eq("guide_id", guideId)
          .order("created_at", { ascending: true });

        if (secsErr) throw secsErr;
        if (secs) setSections(secs);

        const { count, error: countErr } = await supabase
          .from("guide_likes")
          .select("*", { count: "exact", head: true })
          .eq("guide_id", guideId);
          
        if (countErr) throw countErr;
        if (count !== null) setLikeCount(count);

        if (userId) {
          const { data: userChecks, error: checksErr } = await supabase
            .from("user_checklist")
            .select("checklist_id")
            .eq("user_id", userId);
          
          if (checksErr) console.error(checksErr);
          if (userChecks) setMarkedChecks(new Set(userChecks.map(c => c.checklist_id)));

          const { data: likeData, error: likeErr } = await supabase
            .from("guide_likes")
            .select("user_id")
            .eq("guide_id", guideId)
            .eq("user_id", userId)
            .maybeSingle();

          if (likeErr) throw likeErr;
          if (likeData) setIsLiked(true);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (guideId) fetchData();
  }, [gameId, guideId]);

  const toggleLike = async () => {
    if (!currentUserId) {
      showNotification("Error", "Debes iniciar sesión para dar me gusta a una guía.");
      return;
    }
    if (isTogglingLike) return;

    setIsTogglingLike(true);
    try {
      if (isLiked) {
        setLikeCount(prev => prev - 1);
        setIsLiked(false);
        const { error } = await supabase.from("guide_likes").delete().eq("guide_id", guideId).eq("user_id", currentUserId);
        if (error) throw error;
      } else {
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
        const { error } = await supabase.from("guide_likes").insert({ guide_id: guideId, user_id: currentUserId });
        if (error) throw error;
      }
    } catch (error) {
      console.error(error);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      setIsLiked(isLiked);
    } finally {
      setIsTogglingLike(false);
    }
  };

  const toggleCheck = async (checklistId: string) => {
    if (!currentUserId) {
      showNotification("ERROR", "Debes iniciar sesión para guardar tu progreso.");
      return;
    }

    const isMarked = markedChecks.has(checklistId);
    const newSet = new Set(markedChecks);

    try {
      if (isMarked) {
        await supabase.from("user_checklist").delete().match({ user_id: currentUserId, checklist_id: checklistId });
        newSet.delete(checklistId);
      } else {
        await supabase.from("user_checklist").insert({ user_id: currentUserId, checklist_id: checklistId });
        newSet.add(checklistId);
      }
      setMarkedChecks(newSet);
    } catch (error) {
      console.error(error);
    }
  };

  const getDifficultyColor = (diff: number) => {
    const d = Math.round(diff);
    if (d <= 3) return "rgba(21, 128, 61, 0.6)";
    if (d <= 5) return "rgba(101, 163, 13, 0.6)";
    if (d <= 7) return "rgba(202, 138, 4, 0.6)";
    if (d === 8) return "rgba(194, 65, 12, 0.6)";
    if (d === 9) return "rgba(185, 28, 28, 0.6)";
    return "rgba(127, 29, 29, 0.8)";
  };

  const getTimeColor = (hours: number) => {
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

  const getRetroBadgeStyle = (bgColor: string) => ({
    display: "flex", alignItems: "center", gap: "8px", padding: "6px 16px",
    backgroundColor: bgColor,
    backgroundImage: "linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 49%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.6) 100%)",
    backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
    border: "1px solid rgba(255, 255, 255, 0.3)", borderTopColor: "rgba(255, 255, 255, 0.7)", borderBottomColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: "6px", color: "#fff", fontSize: "14px", fontWeight: "bold",
    boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 3px rgba(0, 0, 0, 0.5), 0 4px 10px rgba(0, 0, 0, 0.4)",
    textShadow: "0 1px 2px rgba(0,0,0,0.9)",
  });

  const totalChecks = sections.reduce((acc, sec) => acc + (sec.checklist?.length || 0), 0);
  const progressPercent = totalChecks === 0 ? 0 : Math.round((markedChecks.size / totalChecks) * 100);

  if (loading) return <main style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}></main>;
  if (!guideData) return <main style={{ padding: "50px", textAlign: "center", fontSize: "20px" }}>Guía no encontrada.</main>;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", paddingBottom: "50px" }}>
      
      <div style={{ 
        width: "100%", height: "350px", backgroundColor: "#d1d5db",
        backgroundImage: gameData.banner_url ? `url(${gameData.banner_url})` : "none",
        backgroundSize: "cover", backgroundPosition: "center 25%", borderBottom: "1px solid #ccc"
      }}></div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px", position: "relative", top: "-80px", display: "flex", flexDirection: "column" }}>
        
        <div className="window" style={{ margin: 0 }}>
          
          <style>{`
            [role="menubar"] [role="menuitem"]:hover {
              background: linear-gradient(to bottom, rgba(175, 205, 245, 0.4) 0%, rgba(135, 175, 225, 0.4) 100%) !important;
              color: #000 !important;
              border-radius: 3px;
              box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.05) !important;
              outline: none !important;
            }
            [role="menubar"] {
              padding: 2px 2px 0 2px !important;
            }
            [role="menuitem"] {
              padding: 6px 12px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              cursor: pointer !important;
              margin: 0 1px !important;
            }
          `}</style>

          <ul role="menubar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "14px", position: "relative", marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <li role="menuitem" tabIndex={0} onClick={() => router.push(`/game/${gameId}`)} style={{ gap: "6px", borderRight: "1px solid #ccc", marginRight: "5px", zIndex: 10 }}>
                <ArrowLeft size={14} /> Volver al Juego
              </li>
            </div>
            
            <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", pointerEvents: "none", fontWeight: "bold", color: "#000" }}>
              {guideData.title}
            </div>

            <div style={{ display: "flex", alignItems: "center", zIndex: 10, gap: "6px", padding: 0, margin: 0 }}>
              <span style={{ fontSize: "14px", color: "#444", fontWeight: "bold"}}>{likeCount}</span>
              <button 
                type="button"
                onClick={toggleLike}
                disabled={isTogglingLike}
                style={{ 
                  background: "transparent", border: "none", boxShadow: "none", minWidth: "auto",
                  fontSize: "28px", lineHeight: "1", cursor: "pointer", padding: "0 6px 0 3px", margin: 0,
                  color: isLiked ? "#dc2626" : "#9ca3af",
                  transform: isLiked ? "scale(1.15)" : "scale(1)",
                  transition: "all 0.2s ease"
                }}
                title={isLiked ? "Quitar me gusta" : "Dar me gusta"}
              >
                ♥
              </button>
            </div>
          </ul>

          <div className="window-body" style={{ minHeight: "600px", padding: "30px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "20px", marginTop: 0 }}>
            
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "40px", paddingBottom: "10px" }}>
              
              <div style={{ display: "flex", gap: "15px" }}>
                <div style={getRetroBadgeStyle(getDifficultyColor(guideData.average_difficulty))}>
                  <Dumbbell size={18} style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.8))", strokeWidth: 2.5 }} /> 
                  {guideData.average_difficulty}/10
                </div>

                <div style={getRetroBadgeStyle(getTimeColor(guideData.average_time))}>
                  <Clock size={18} style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.8))", strokeWidth: 2.5 }} /> 
                  {guideData.average_time}h
                </div>
              </div>

              {totalChecks > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#64748b" }}>Progreso: {progressPercent}%</span>
                  
                  <style>{`
                    @keyframes w7-shine {
                      0% { left: -100%; filter: brightness(1); }
                      50% { filter: brightness(1.3); }
                      100% { left: 200%; filter: brightness(1); }
                    }
                    .animated-bar > div {
                      transition: width 0.4s ease-out !important;
                      position: relative;
                      overflow: hidden;
                    }
                    .animated-bar > div::after {
                      content: "";
                      position: absolute;
                      top: 0; 
                      left: -100%; 
                      width: 100%; 
                      height: 100%;
                      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
                      animation: w7-shine 2s infinite linear;
                    }
                  `}</style>

                  <div role="progressbar" className="animated-bar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} style={{ width: "150px", margin: 0 }}>
                    <div style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            <hr style={{ width: "100%", border: "none", borderBottom: "1px solid #e5e7eb", margin: 0 }} />
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "10px" }}>
              {sections.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888", padding: "50px" }}>Esta guía aún no tiene contenido.</div>
              ) : (
                sections.map((sec, index) => {
                  const isCollapsed = collapsedSections[sec.id];
                  
                  return (
                    <div key={sec.id} className="window" style={{ margin: 0, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                      <div 
                        className="title-bar" 
                        onClick={() => toggleSection(sec.id)}
                        style={{ cursor: "pointer", padding: "4px 8px" }}
                      >
                        <div className="title-bar-text" style={{ fontSize: "14px", fontWeight: "bold" }}>
                          {sec.title || `Sección ${index + 1}`}
                        </div>
                        <div className="title-bar-controls">
                          <button 
                            aria-label={isCollapsed ? "Maximize" : "Minimize"} 
                            onClick={(e) => { e.stopPropagation(); toggleSection(sec.id); }}
                          ></button>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="window-body" style={{ margin: 0, padding: "20px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "15px" }}>
                          {sec.text && (
                            <div style={{ fontSize: "15px", lineHeight: "1.6", color: "#334155" }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}>{sec.text}</ReactMarkdown>
                            </div>
                          )}

                          {sec.checklist && sec.checklist.length > 0 && (
                            <div style={{ 
                              margin: "5px -20px -20px -20px", 
                              backgroundColor: "#f8fafc", 
                              borderTop: "1px solid #e2e8f0", 
                              padding: "15px 20px", 
                              display: "flex", 
                              flexDirection: "column", 
                              gap: "10px",
                              borderBottomLeftRadius: "3px",
                              borderBottomRightRadius: "3px"
                            }}>
                              <div style={{ fontWeight: "bold", fontSize: "13px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "5px" }}>
                                <Award size={14} /> Tareas
                              </div>
                              {sec.checklist.map((check: any) => {
                                const isMarked = markedChecks.has(check.id);
                                return (
                                  <div 
                                    key={check.id} 
                                    onClick={() => toggleCheck(check.id)}
                                    style={{ 
                                      display: "flex", alignItems: "center", gap: "10px", padding: "8px", 
                                      backgroundColor: isMarked ? "#dcfce7" : "#fff", border: "1px solid", 
                                      borderColor: isMarked ? "#86efac" : "#cbd5e1", borderRadius: "3px", 
                                      cursor: "pointer", transition: "all 0.2s"
                                    }}
                                  >
                                    <div style={{ color: isMarked ? "#22c55e" : "#94a3b8", display: "flex", alignItems: "center" }}>
                                      {isMarked ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </div>
                                    <span style={{ fontSize: "14px", color: isMarked ? "#166534" : "#334155", textDecoration: isMarked ? "line-through" : "none" }}>
                                      {check.text}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <hr style={{ width: "100%", border: "none", borderBottom: "1px solid #e5e7eb", marginTop: "20px" }} />        
            <div style={{ textAlign: "center", fontSize: "14px", color: "#64748b", paddingBottom: "10px" }}>
              por <span style={{ color: "#3b82f6", fontWeight: "bold"}}>{guideData.profiles?.nickname}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}