"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Clock, Dumbbell, Award, CheckSquare, Square } from "lucide-react";

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

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let userId = null;
        if (session) {
          userId = session.user.id;
          setCurrentUserId(userId);
        }

        const res = await fetch(`/api/igdb/game?id=${gameId}`);
        if (res.ok) {
          const gData = await res.json();
          setGameData(gData);
        }

        const { data: guide } = await supabase
          .from("guides")
          .select("*, profiles(nickname)")
          .eq("id", guideId)
          .single();
        
        if (guide) setGuideData(guide);

        const { data: secs } = await supabase
          .from("guide_sections")
          .select(`id, title, text, checklist (id, text)`)
          .eq("guide_id", guideId)
          .order("created_at", { ascending: true });

        if (secs) setSections(secs);

        if (userId) {
          const { data: userChecks } = await supabase
            .from("user_checklist")
            .select("checklist_id")
            .eq("user_id", userId);
          
          if (userChecks) {
            setMarkedChecks(new Set(userChecks.map(c => c.checklist_id)));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (guideId) fetchData();
  }, [gameId, guideId]);

  const toggleCheck = async (checklistId: string) => {
    if (!currentUserId) return alert("Debes iniciar sesión para guardar tu progreso.");

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

  const totalChecks = sections.reduce((acc, sec) => acc + (sec.checklist?.length || 0), 0);
  const progressPercent = totalChecks === 0 ? 0 : Math.round((markedChecks.size / totalChecks) * 100);

  if (loading) return <main style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}></main>;
  if (!guideData) return <main style={{ padding: "50px", textAlign: "center" }}>Guía no encontrada.</main>;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", paddingBottom: "50px" }}>
      
      <div style={{ 
        width: "100%", height: "350px", backgroundColor: "#d1d5db",
        backgroundImage: gameData.banner_url ? `url(${gameData.banner_url})` : "none",
        backgroundSize: "cover", backgroundPosition: "center 25%", borderBottom: "1px solid #ccc"
      }}></div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px", position: "relative", top: "-80px", display: "flex", flexDirection: "column" }}>
        
        <div className="window" style={{ margin: 0 }}>
          
          <ul role="menubar" style={{ display: "flex", alignItems: "center", fontSize: "14px", padding: "2px 2px 0 2px", marginBottom: 0, position: "relative" }}>
            <li role="menuitem" tabIndex={0} onClick={() => router.push(`/game/${gameId}`)} style={{ gap: "6px", borderRight: "1px solid #ccc", marginRight: "5px", zIndex: 10, cursor: "pointer", padding: "6px 12px", display: "flex", alignItems: "center" }}>
              <ArrowLeft size={14} /> Volver al Juego
            </li>
            
            <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", pointerEvents: "none", fontWeight: "bold", color: "#000" }}>
              {guideData.title}
            </div>
          </ul>

          <div className="window-body" style={{ minHeight: "600px", padding: "30px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "20px", marginTop: 0 }}>
            
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "40px", paddingBottom: "10px" }}>
              
              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 18px", backgroundColor: "#e0f2fe", border: "1px solid #7dd3fc", borderRadius: "6px", fontSize: "15px", fontWeight: "bold", color: "#0369a1", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                  <Dumbbell size={18}/> {guideData.average_difficulty}/10
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 18px", backgroundColor: "#e0f2fe", border: "1px solid #7dd3fc", borderRadius: "6px", fontSize: "15px", fontWeight: "bold", color: "#0369a1", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                  <Clock size={18}/> {guideData.average_time}h
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
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{sec.text}</ReactMarkdown>
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
              Guía escrita por <span style={{ color: "#3b82f6", fontWeight: "bold" }}>{guideData.profiles?.nickname}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}