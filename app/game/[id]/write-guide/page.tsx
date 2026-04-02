"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, Image as ImageIcon, BookOpen, ListChecks, Plus, Trash2, ArrowLeft, Settings, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function WriteGuidePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [loadingGame, setLoadingGame] = useState(true);
  const [gameData, setGameData] = useState<any>({ title: "Cargando...", banner_url: "" });
  
  const [activeTab, setActiveTab] = useState<"def" | "guide" | "checklist">("def");
  const [isSaving, setIsSaving] = useState(false);
  const [existingGuideId, setExistingGuideId] = useState<string | null>(null);

  const [guideInfo, setGuideInfo] = useState({ title: "", average_time: "", average_difficulty: 1 });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const guideIdFromUrl = searchParams.get("guideId");

  const [sections, setSections] = useState([
    { id: Date.now().toString(), title: "Introducción", text: "", checklists: [{ id: Date.now().toString() + "c", text: "" }] }
  ]);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const { data, error } = await supabase
          .from("games")
          .select("title, banner_url")
          .eq("id", gameId)
          .single();
        if (data) setGameData(data);
      } catch (error) {
        console.error("Error cargando el juego:", error);
      } finally {
        setLoadingGame(false);
      }
    };
    if (gameId) fetchGame();
  }, [gameId]);

  useEffect(() => {
    const loadExistingGuide = async () => {
      if (!guideIdFromUrl) return;
      
      const { data: guide } = await supabase
        .from("guides")
        .select("*")
        .eq("id", guideIdFromUrl)
        .single();

      if (guide) {
        setExistingGuideId(guide.id);
        setGuideInfo({
          title: guide.title,
          average_time: guide.average_time || "",
          average_difficulty: guide.average_difficulty
        });
        if (guide.cover_url) setCoverPreview(guide.cover_url);
        
        const { data: sectionsData } = await supabase
          .from("guide_sections")
          .select(`
            id, title, text,
            checklist (id, text)
          `)
          .eq("guide_id", guide.id)
          .order("created_at", { ascending: true });

        if (sectionsData) {
          const formatted = sectionsData.map(s => ({
            id: s.id,
            title: s.title,
            text: s.text,
            checklists: s.checklist || []
          }));
          setSections(formatted);
        }
      }
    };

    loadExistingGuide();
  }, [guideIdFromUrl]);

  const addSection = () => setSections([...sections, { id: Date.now().toString(), title: "", text: "", checklists: [] }]);
  const updateSection = (id: string, field: "title" | "text", value: string) => setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  const removeSection = (id: string) => { if (sections.length > 1) setSections(sections.filter(s => s.id !== id)); };
  const addChecklist = (sectionId: string) => setSections(sections.map(s => s.id === sectionId ? { ...s, checklists: [...s.checklists, { id: Date.now().toString(), text: "" }] } : s));
  const updateChecklist = (sectionId: string, checklistId: string, text: string) => setSections(sections.map(s => s.id === sectionId ? { ...s, checklists: s.checklists.map(c => c.id === checklistId ? { ...c, text } : c) } : s));
  const removeChecklist = (sectionId: string, checklistId: string) => setSections(sections.map(s => s.id === sectionId ? { ...s, checklists: s.checklists.filter(c => c.id !== checklistId) } : s));

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!guideInfo.title) return alert("¡Ponle un título a la guía primero!");
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No estás logueado");

      let finalCoverUrl = null;
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}-${gameId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("guide_covers").upload(fileName, coverFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("guide_covers").getPublicUrl(fileName);
        finalCoverUrl = publicUrlData.publicUrl;
      }

      const guideDataObj: any = {
        user_id: user.id, game_id: Number(gameId), title: guideInfo.title,
        average_time: Number(guideInfo.average_time) || null, average_difficulty: guideInfo.average_difficulty
      };
      if (finalCoverUrl) guideDataObj.cover_url = finalCoverUrl;
      if (existingGuideId) guideDataObj.id = existingGuideId;

      const { data: guideData, error: guideError } = await supabase.from("guides").upsert(guideDataObj).select().single();
      if (guideError) throw guideError;
      setExistingGuideId(guideData.id);

      await supabase.from("guide_sections").delete().eq("guide_id", guideData.id);

      for (const sec of sections) {
        if (!sec.title && !sec.text) continue;
        const { data: newSec, error: secError } = await supabase.from("guide_sections").insert({ guide_id: guideData.id, title: sec.title || "Sección sin título", text: sec.text }).select().single();
        if (secError) throw secError;

        const checksToInsert = sec.checklists.filter(c => c.text.trim() !== "").map(c => ({ guide_section_id: newSec.id, text: c.text }));
        if (checksToInsert.length > 0) {
          const { error: checkError } = await supabase.from("checklist").insert(checksToInsert);
          if (checkError) throw checkError;
        }
      }
      alert("¡Guía guardada/publicada con éxito! Eres una leyenda.");
    } catch (error: any) {
      console.error(error);
      alert("Error guardando la guía: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", paddingBottom: "50px" }}>
      
      <div style={{ 
        width: "100%", height: "350px", backgroundColor: "#d1d5db",
        backgroundImage: gameData.banner_url ? `url(${gameData.banner_url})` : "none",
        backgroundSize: "cover", backgroundPosition: "center 25%", borderBottom: "1px solid #ccc"
      }}>
        {!gameData.banner_url && !loadingGame && <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>🖼️</div>}
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px", position: "relative", top: "-80px", display: "flex", flexDirection: "column", gap: "15px" }}>
        
        <div className="window" style={{ padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button className="default aero-btn-list" onClick={() => router.push(`/game/${gameId}`)} style={{ padding: "4px 8px" }}>
              <ArrowLeft size={16} /> Volver al Juego
            </button>
            <span style={{ fontWeight: "bold", fontSize: "16px", marginLeft: "10px" }}>Escribiendo guía para: <span style={{ color: "#3b82f6" }}>{gameData.title}</span></span>
          </div>
          <button 
            className="default aero-btn-list" onClick={handleSave} disabled={isSaving}
            style={{ padding: "6px 15px", fontWeight: "bold", backgroundColor: "#3b82f6", color: "white", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Save size={16} /> {isSaving ? "Guardando..." : (existingGuideId ? "Actualizar Guía" : "Publicar Guía")}
          </button>
        </div>

        <menu role="tablist" style={{ margin: 0, padding: 0, display: "flex", gap: "2px" }}>
          <li role="tab" aria-selected={activeTab === "def"} onClick={() => setActiveTab("def")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <a style={{ display: "flex", alignItems: "center", gap: "5px" }}><Settings size={14}/> Definición</a>
          </li>
          <li role="tab" aria-selected={activeTab === "guide"} onClick={() => setActiveTab("guide")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <a style={{ display: "flex", alignItems: "center", gap: "5px" }}><BookOpen size={14}/> Escritura</a>
          </li>
          <li role="tab" aria-selected={activeTab === "checklist"} onClick={() => setActiveTab("checklist")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <a style={{ display: "flex", alignItems: "center", gap: "5px" }}><ListChecks size={14}/> Checklist</a>
          </li>
        </menu>

        <div className="window" style={{ margin: 0 }}>
          <div className="window-body" style={{ minHeight: "500px", padding: "25px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {activeTab === "def" && (
              <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
                <fieldset style={{ width: "250px", padding: "15px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", flexShrink: 0 }}>
                  <legend>Portada de la Guía</legend>
                  <div style={{ width: "100%", aspectRatio: "3/4", border: "2px dashed #94a3b8", backgroundColor: "#f8fafc", position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {coverPreview ? (
                      <>
                        <img src={coverPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={() => { setCoverFile(null); setCoverPreview(null); }} style={{ position: "absolute", top: "-10px", right: "-10px", background: "red", color: "white", borderRadius: "50%", padding: "4px", border: "2px solid white", cursor: "pointer" }}>
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <label style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "20px", textAlign: "center" }}>
                        <ImageIcon size={32} color="#94a3b8" />
                        <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "bold" }}>Subir Imagen</span>
                        <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>
                </fieldset>

                <fieldset style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <legend>Información Principal</legend>
                  <div className="field-row-stacked">
                    <label style={{ fontWeight: "bold" }}>Título de la Guía:</label>
                    <input type="text" value={guideInfo.title} onChange={e => setGuideInfo({...guideInfo, title: e.target.value})} placeholder="Ej: Guía Platino 100% Dark Souls II" style={{ width: "100%", padding: "6px" }} />
                  </div>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <div className="field-row-stacked" style={{ flex: 1 }}>
                      <label style={{ fontWeight: "bold" }}>Tiempo Estimado (H):</label>
                      <input type="number" value={guideInfo.average_time} onChange={e => setGuideInfo({...guideInfo, average_time: e.target.value})} placeholder="Ej: 80" style={{ width: "100%", padding: "6px" }} />
                    </div>
                    <div className="field-row-stacked" style={{ flex: 1 }}>
                      <label style={{ fontWeight: "bold" }}>Dificultad (1-10):</label>
                      <input type="number" min="1" max="10" value={guideInfo.average_difficulty} onChange={e => setGuideInfo({...guideInfo, average_difficulty: Number(e.target.value)})} style={{ width: "100%", padding: "6px" }} />
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {activeTab === "guide" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                {sections.map((sec, index) => (
                  <fieldset key={sec.id} style={{ padding: "15px", position: "relative", backgroundColor: "#fafafa" }}>
                    <legend style={{ fontWeight: "bold", color: "#3b82f6" }}>Sección {index + 1}</legend>
                    <button onClick={() => removeSection(sec.id)} style={{ position: "absolute", top: "-12px", right: "10px", background: "#f87171", border: "1px solid #dc2626", color: "white", cursor: "pointer", padding: "2px 6px", borderRadius: "3px" }} title="Eliminar Sección"><Trash2 size={14} /></button>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <input 
                        type="text" value={sec.title} onChange={e => updateSection(sec.id, "title", e.target.value)}
                        placeholder="Título de la sección (Ej: Mundo Pintado de Ariamis)" 
                        style={{ width: "100%", padding: "8px", fontSize: "16px", fontWeight: "bold" }} 
                      />
                      <textarea 
                        value={sec.text} onChange={e => updateSection(sec.id, "text", e.target.value)}
                        placeholder="Escribe aquí los secretos, pasos y consejos..."
                        style={{ width: "100%", padding: "10px", minHeight: "150px", resize: "vertical", fontFamily: "inherit" }} 
                      />
                    </div>
                  </fieldset>
                ))}
                <button className="default aero-btn-list" onClick={addSection} style={{ alignSelf: "center", padding: "6px 15px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Plus size={16} /> Añadir Nueva Sección
                </button>
              </div>
            )}

            {activeTab === "checklist" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ backgroundColor: "#e0f2fe", border: "1px solid #bae6fd", padding: "10px", borderRadius: "4px", fontSize: "13px", color: "#0369a1" }}>
                  ℹ️ Las tareas se agrupan automáticamente según las secciones que hayas creado en la pestaña <b>Escritura</b>.
                </div>
                
                {sections.map((sec, index) => (
                  <fieldset key={sec.id} style={{ padding: "15px" }}>
                    <legend style={{ fontWeight: "bold" }}>{sec.title || `Sección ${index + 1} (Sin Título)`}</legend>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {sec.checklists.map((check) => (
                        <div key={check.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input type="checkbox" disabled style={{ margin: 0 }} />
                          <input 
                            type="text" value={check.text} onChange={e => updateChecklist(sec.id, check.id, e.target.value)}
                            placeholder="Ej: Recoger el Ascua Grande" style={{ flex: 1, padding: "4px 8px" }} 
                          />
                          <button onClick={() => removeChecklist(sec.id, check.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addChecklist(sec.id)} style={{ alignSelf: "flex-start", marginTop: "5px", background: "none", border: "none", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                        <Plus size={14} /> Añadir tarea a esta sección
                      </button>
                    </div>
                  </fieldset>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}