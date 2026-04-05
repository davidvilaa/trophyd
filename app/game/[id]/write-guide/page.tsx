"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, Image as ImageIcon, BookOpen, ListChecks, Plus, Trash2, ArrowLeft, Settings, X, Eye, Edit2, Bold, Italic, Link } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      setLoadingGame(true);
      try {
        const res = await fetch(`/api/igdb/game?id=${gameId}`);
        if (res.ok) {
          const data = await res.json();
          setGameData(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingGame(false);
      }
    };
    fetchGame();
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
          .select(`id, title, text, checklist (id, text)`)
          .eq("guide_id", guide.id)
          .order("created_at", { ascending: true });

        if (sectionsData && sectionsData.length > 0) {
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

  const applyFormat = (sectionId: string, type: "bold" | "italic" | "link" | "image") => {
    const textarea = document.getElementById(`textarea-${sectionId}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = sections.find(s => s.id === sectionId)?.text || "";
    const selection = text.substring(start, end);

    let insert = "";
    let newCursorStart = start;
    let newCursorEnd = start;

    if (type === "bold") {
      insert = `**${selection}**`;
      newCursorStart = start + 2;
      newCursorEnd = start + 2 + selection.length;
    }
    if (type === "italic") {
      insert = `*${selection}*`;
      newCursorStart = start + 1;
      newCursorEnd = start + 1 + selection.length;
    }
    if (type === "link") {
      const linkText = selection || "texto";
      insert = `[${linkText}](url)`;
      newCursorStart = start + 1;
      newCursorEnd = start + 1 + linkText.length;
    }
    if (type === "image") {
      const altText = selection || "alt";
      insert = `![${altText}](url)`;
      newCursorStart = start + 2;
      newCursorEnd = start + 2 + altText.length;
    }

    const newText = text.substring(0, start) + insert + text.substring(end);
    updateSection(sectionId, "text", newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 10);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!guideInfo.title) return alert("¡Ponle un título!");
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let finalCoverUrl = null;
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}-${gameId}-${Date.now()}.${fileExt}`;
        await supabase.storage.from("guide_covers").upload(fileName, coverFile, { upsert: true });
        const { data: publicUrlData } = supabase.storage.from("guide_covers").getPublicUrl(fileName);
        finalCoverUrl = publicUrlData.publicUrl;
      }

      const guideDataObj: any = {
        user_id: user.id, game_id: Number(gameId), title: guideInfo.title,
        average_time: Number(guideInfo.average_time) || null, average_difficulty: guideInfo.average_difficulty
      };
      if (finalCoverUrl) guideDataObj.cover_url = finalCoverUrl;
      if (existingGuideId) guideDataObj.id = existingGuideId;

      const { data: guideData } = await supabase.from("guides").upsert(guideDataObj).select().single();
      if (!guideData) return;
      setExistingGuideId(guideData.id);

      await supabase.from("guide_sections").delete().eq("guide_id", guideData.id);

      for (const sec of sections) {
        if (!sec.title && !sec.text) continue;
        const { data: newSec } = await supabase.from("guide_sections").insert({ guide_id: guideData.id, title: sec.title || "Sección sin título", text: sec.text }).select().single();
        if (!newSec) continue;

        const checksToInsert = sec.checklists.filter(c => c.text.trim() !== "").map(c => ({ guide_section_id: newSec.id, text: c.text }));
        if (checksToInsert.length > 0) await supabase.from("checklist").insert(checksToInsert);
      }
      alert("¡Guardado!");
    } catch (error) {
      console.error(error);
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

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px", position: "relative", top: "-80px", display: "flex", flexDirection: "column" }}>
        
        <div className="window" style={{ margin: 0 }}>
          
          <style>{`
            .tab-activa,
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

          <ul role="menubar" style={{ display: "flex", alignItems: "center", fontSize: "14px", padding: "2px 2px 0 2px", marginBottom: 0 }}>
            <li role="menuitem" tabIndex={0} onClick={() => router.push(`/game/${gameId}`)} style={{ gap: "6px", borderRight: "1px solid #ccc", marginRight: "5px" }}>
              <ArrowLeft size={14} /> Volver
            </li>
            
            <li role="menuitem" tabIndex={0} className={activeTab === "def" ? "tab-activa" : ""} onClick={() => setActiveTab("def")} style={{ gap: "6px" }}>
              <Settings size={14}/> Definición
            </li>
            
            <li role="menuitem" tabIndex={0} className={activeTab === "guide" ? "tab-activa" : ""} onClick={() => setActiveTab("guide")} style={{ gap: "6px" }}>
              <BookOpen size={14}/> Escritura
            </li>
            
            <li role="menuitem" tabIndex={0} className={activeTab === "checklist" ? "tab-activa" : ""} onClick={() => setActiveTab("checklist")} style={{ gap: "6px" }}>
              <ListChecks size={14}/> Checklist
            </li>
            
            <div style={{ flex: 1 }}></div>
            
            <li role="menuitem" tabIndex={0} className="tab-activa" onClick={isSaving ? undefined : handleSave} style={{ gap: "6px" }}>
              <Save size={14} /> {isSaving ? "..." : (existingGuideId ? "Actualizar" : "Publicar")}
            </li>
          </ul>

          <div className="window-body" style={{ minHeight: "500px", padding: "25px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "20px", marginTop: 0 }}>
            
            {activeTab === "def" && (
              <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
                <fieldset style={{ width: "250px", padding: "15px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", flexShrink: 0 }}>
                  <legend>Portada</legend>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: "10px" }}>
                    <div style={{ 
                      width: "150px", aspectRatio: "3/4", border: "2px inset #fff", backgroundColor: "#ccc",
                      backgroundImage: coverPreview ? `url(${coverPreview})` : "none",
                      backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {!coverPreview && <span style={{ fontSize: "3rem", color: "#9ca3af" }}>🖼️</span>}
                    </div>
                    
                    <input type="file" id="cover-upload" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
                    <button onClick={() => document.getElementById("cover-upload")?.click()} style={{ width: "150px" }}>
                      Cambiar foto
                    </button>
                  </div>
                </fieldset>

                <fieldset style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <legend>Información</legend>
                  <div className="field-row-stacked">
                    <label style={{ fontWeight: "bold" }}>Título:</label>
                    <input type="text" value={guideInfo.title} onChange={e => setGuideInfo({...guideInfo, title: e.target.value})} style={{ width: "100%", padding: "6px" }} />
                  </div>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <div className="field-row-stacked" style={{ flex: 1 }}>
                      <label style={{ fontWeight: "bold" }}>Horas:</label>
                      <input type="number" value={guideInfo.average_time} onChange={e => setGuideInfo({...guideInfo, average_time: e.target.value})} style={{ width: "100%", padding: "6px" }} />
                    </div>
                    <div className="field-row-stacked" style={{ flex: 1 }}>
                      <label style={{ fontWeight: "bold" }}>Dificultad:</label>
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
                    <button onClick={() => removeSection(sec.id)} style={{ position: "absolute", top: "-12px", right: "10px", background: "#f87171", border: "1px solid #dc2626", color: "white", cursor: "pointer", padding: "2px 6px", borderRadius: "3px" }}><Trash2 size={14} /></button>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <input type="text" value={sec.title} onChange={e => updateSection(sec.id, "title", e.target.value)} placeholder="Título..." style={{ width: "100%", padding: "8px", fontWeight: "bold" }} />
                      
                      <ul role="menubar" style={{ display: "flex", fontSize: "12px", padding: "0", marginBottom: 0, width: "fit-content" }}>
                        <li role="menuitem" tabIndex={0} onClick={() => setPreviewMode({...previewMode, [sec.id]: false})} className={!previewMode[sec.id] ? "tab-activa" : ""} style={{ gap: "4px", padding: "4px 10px", cursor: "pointer" }}>
                          <Edit2 size={12}/> Editar
                        </li>
                        <li role="menuitem" tabIndex={0} onClick={() => setPreviewMode({...previewMode, [sec.id]: true})} className={previewMode[sec.id] ? "tab-activa" : ""} style={{ gap: "4px", padding: "4px 10px", cursor: "pointer" }}>
                          <Eye size={12}/> Vista Previa
                        </li>
                      </ul>

                      {!previewMode[sec.id] ? (
                        <div style={{ display: "flex", flexDirection: "column", border: "1px solid #ccc", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ display: "flex", gap: "2px", padding: "4px", backgroundColor: "#f3f4f6", borderBottom: "1px solid #ccc", alignItems: "center" }}>
                            <button onClick={() => applyFormat(sec.id, "bold")} style={{ width: "40px", minWidth: "26px", height: "26px", minHeight: "26px", padding: 0, margin: 0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "none", border: "1px solid transparent", borderRadius: "3px" }}>
                              <Bold size={14} />
                            </button>
                            <button onClick={() => applyFormat(sec.id, "italic")} style={{ width: "40px", minWidth: "26px", height: "26px", minHeight: "26px", padding: 0, margin: 0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "none", border: "1px solid transparent", borderRadius: "3px" }}>
                              <Italic size={14} />
                            </button>
                            <div style={{ width: "1px", height: "16px", backgroundColor: "#ccc", margin: "0 4px" }}></div>
                            <button onClick={() => applyFormat(sec.id, "link")} style={{ width: "40px", minWidth: "26px", height: "26px", minHeight: "26px", padding: 0, margin: 0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "none", border: "1px solid transparent", borderRadius: "3px" }}>
                              <Link size={14} />
                            </button>
                            <button onClick={() => applyFormat(sec.id, "image")} style={{ width: "40px", minWidth: "26px", height: "26px", minHeight: "26px", padding: 0, margin: 0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "none", border: "1px solid transparent", borderRadius: "3px" }}>
                              <ImageIcon size={14} />
                            </button>
                          </div>
                          <textarea 
                            id={`textarea-${sec.id}`}
                            value={sec.text} 
                            onChange={e => updateSection(sec.id, "text", e.target.value)} 
                            placeholder="Escribe aquí..." 
                            style={{ width: "100%", padding: "10px", minHeight: "150px", resize: "vertical", fontFamily: "monospace", border: "none", outline: "none" }} 
                          />
                        </div>
                      ) : (
                        <div style={{ width: "100%", padding: "10px", minHeight: "180px", backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "2px", overflowY: "auto" }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{sec.text || "*Nada que mostrar todavía...*"}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </fieldset>
                ))}
                <button className="default aero-btn-list" onClick={addSection} style={{ alignSelf: "center", padding: "6px 15px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Plus size={16} /> Nueva Sección
                </button>
              </div>
            )}

            {activeTab === "checklist" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {sections.map((sec, index) => (
                  <fieldset key={sec.id} style={{ padding: "15px" }}>
                    <legend style={{ fontWeight: "bold" }}>{sec.title || `Sección ${index + 1}`}</legend>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {sec.checklists.map((check) => (
                        <div key={check.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input type="checkbox" disabled />
                          <input type="text" value={check.text} onChange={e => updateChecklist(sec.id, check.id, e.target.value)} placeholder="Tarea..." style={{ flex: 1, padding: "4px 8px" }} />
                          <button onClick={() => removeChecklist(sec.id, check.id)} style={{ background: "#f87171", border: "1px solid #dc2626", color: "white", cursor: "pointer", padding: "2px 6px", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addChecklist(sec.id)} style={{ alignSelf: "flex-start", marginTop: "5px", background: "none", border: "none", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Plus size={14} /> Añadir tarea
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