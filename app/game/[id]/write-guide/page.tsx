"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, Image as ImageIcon, BookOpen, ListChecks, Plus, Trash2, ArrowLeft, X } from "lucide-react";

export default function WriteGuidePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [activeTab, setActiveTab] = useState<"cover" | "guide" | "checklist">("guide");
  const [isSaving, setIsSaving] = useState(false);
  const [existingGuideId, setExistingGuideId] = useState<string | null>(null);

  const [guideInfo, setGuideInfo] = useState({ title: "", average_time: "", average_difficulty: 1 });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [sections, setSections] = useState([
    { id: Date.now().toString(), title: "Introducción", text: "", checklists: [{ id: Date.now().toString() + "c", text: "" }] }
  ]);

  const addSection = () => {
    setSections([...sections, { id: Date.now().toString(), title: "", text: "", checklists: [] }]);
  };

  const updateSection = (id: string, field: "title" | "text", value: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSection = (id: string) => {
    if (sections.length > 1) setSections(sections.filter(s => s.id !== id));
  };

  const addChecklist = (sectionId: string) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, checklists: [...s.checklists, { id: Date.now().toString(), text: "" }] } : s));
  };

  const updateChecklist = (sectionId: string, checklistId: string, text: string) => {
    setSections(sections.map(s => s.id === sectionId 
      ? { ...s, checklists: s.checklists.map(c => c.id === checklistId ? { ...c, text } : c) } 
      : s
    ));
  };

  const removeChecklist = (sectionId: string, checklistId: string) => {
    setSections(sections.map(s => s.id === sectionId 
      ? { ...s, checklists: s.checklists.filter(c => c.id !== checklistId) } 
      : s
    ));
  };

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
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("guide_covers")
          .upload(fileName, coverFile, { upsert: true });

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from("guide_covers").getPublicUrl(fileName);
        finalCoverUrl = publicUrlData.publicUrl;
      }

      const guideDataObj: any = {
        user_id: user.id,
        game_id: Number(gameId),
        title: guideInfo.title,
        average_time: Number(guideInfo.average_time) || null,
        average_difficulty: guideInfo.average_difficulty
      };
      if (finalCoverUrl) guideDataObj.cover_url = finalCoverUrl;

      if (existingGuideId) guideDataObj.id = existingGuideId;

      const { data: guideData, error: guideError } = await supabase
        .from("guides")
        .upsert(guideDataObj)
        .select()
        .single();

      if (guideError) throw guideError;
      setExistingGuideId(guideData.id); 

      await supabase.from("guide_sections").delete().eq("guide_id", guideData.id);

      for (const sec of sections) {
        if (!sec.title && !sec.text) continue;

        const { data: newSec, error: secError } = await supabase
          .from("guide_sections")
          .insert({ guide_id: guideData.id, title: sec.title || "Sección sin título", text: sec.text })
          .select()
          .single();

        if (secError) throw secError;

        const checksToInsert = sec.checklists
          .filter(c => c.text.trim() !== "")
          .map(c => ({ guide_section_id: newSec.id, text: c.text }));

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
    <main style={{ minHeight: "100vh", backgroundColor: "#e2e8f0", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        <div className="window" style={{ padding: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button className="default aero-btn-list" onClick={() => router.push(`/game/${gameId}`)} style={{ padding: "5px 10px" }}>
              <ArrowLeft size={16} /> Volver
            </button>
            <h1 style={{ margin: 0, fontSize: "20px", color: "#1e293b", textShadow: "0 1px 0 #fff" }}>📝 Creador de Guías</h1>
          </div>
          <button 
            className="default aero-btn-list" 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ padding: "8px 20px", fontWeight: "bold", backgroundColor: "#3b82f6", color: "white", borderColor: "#2563eb" }}
          >
            {isSaving ? "Guardando..." : (existingGuideId ? "Actualizar Guía" : "Publicar Guía")} <Save size={18} style={{ marginLeft: "5px" }} />
          </button>
        </div>

        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          
          <div className="window" style={{ width: "200px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <button 
              className="default aero-btn-list" 
              onClick={() => setActiveTab("cover")}
              style={{ textAlign: "left", padding: "10px", backgroundColor: activeTab === "cover" ? "#e0f2fe" : "", fontWeight: activeTab === "cover" ? "bold" : "normal" }}
            >
              <ImageIcon size={16} style={{ marginRight: "8px" }} /> Portada
            </button>
            <button 
              className="default aero-btn-list" 
              onClick={() => setActiveTab("guide")}
              style={{ textAlign: "left", padding: "10px", backgroundColor: activeTab === "guide" ? "#e0f2fe" : "", fontWeight: activeTab === "guide" ? "bold" : "normal" }}
            >
              <BookOpen size={16} style={{ marginRight: "8px" }} /> Guía y Secciones
            </button>
            <button 
              className="default aero-btn-list" 
              onClick={() => setActiveTab("checklist")}
              style={{ textAlign: "left", padding: "10px", backgroundColor: activeTab === "checklist" ? "#e0f2fe" : "", fontWeight: activeTab === "checklist" ? "bold" : "normal" }}
            >
              <ListChecks size={16} style={{ marginRight: "8px" }} /> Checklists
            </button>
          </div>

          <div className="window window-body" style={{ flex: 1, padding: "30px", minHeight: "600px", margin: 0, backgroundColor: "#fff" }}>
            
            {activeTab === "cover" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <h2 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px", marginTop: 0 }}>Portada de la Guía</h2>
                <p style={{ color: "#666", fontSize: "14px" }}>Sube una imagen épica para que tu guía destaque en la comunidad.</p>
                
                <div style={{ border: "2px dashed #ccc", padding: "20px", textAlign: "center", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                  {coverPreview ? (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img src={coverPreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "4px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                      <button 
                        onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                        style={{ position: "absolute", top: "-10px", right: "-10px", background: "red", color: "white", borderRadius: "50%", padding: "5px", border: "2px solid white", cursor: "pointer" }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "40px" }}>
                      <ImageIcon size={48} color="#94a3b8" />
                      <span style={{ fontWeight: "bold", color: "#3b82f6" }}>Haz clic para subir una imagen</span>
                      <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
                    </label>
                  )}
                </div>
              </div>
            )}

            {activeTab === "guide" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                <div>
                  <h2 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px", marginTop: 0 }}>Información General</h2>
                  <div style={{ display: "flex", gap: "15px", marginTop: "15px" }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>TÍTULO DE LA GUÍA</label>
                      <input 
                        type="text" value={guideInfo.title} onChange={e => setGuideInfo({...guideInfo, title: e.target.value})}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} placeholder="Ej: Guía Platino 100% Dark Souls"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>TIEMPO ESTIMADO (H)</label>
                      <input 
                        type="number" value={guideInfo.average_time} onChange={e => setGuideInfo({...guideInfo, average_time: e.target.value})}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} placeholder="Ej: 80"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>DIFICULTAD (1-10)</label>
                      <input 
                        type="number" min="1" max="10" value={guideInfo.average_difficulty} onChange={e => setGuideInfo({...guideInfo, average_difficulty: Number(e.target.value)})}
                        style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Secciones</h2>
                  {sections.map((sec, index) => (
                    <div key={sec.id} style={{ border: "1px solid #e2e8f0", padding: "20px", marginBottom: "20px", borderRadius: "6px", backgroundColor: "#f8fafc", position: "relative" }}>
                      <button onClick={() => removeSection(sec.id)} style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={18} /></button>
                      <input 
                        type="text" value={sec.title} onChange={e => updateSection(sec.id, "title", e.target.value)}
                        style={{ width: "90%", padding: "8px", fontSize: "18px", fontWeight: "bold", border: "none", borderBottom: "2px solid #ccc", background: "transparent", marginBottom: "15px" }} placeholder={`Título de la Sección ${index + 1}`}
                      />
                      <textarea 
                        value={sec.text} onChange={e => updateSection(sec.id, "text", e.target.value)}
                        style={{ width: "100%", padding: "15px", minHeight: "150px", border: "1px solid #ccc", borderRadius: "4px", resize: "vertical", fontFamily: "inherit" }} placeholder="Escribe aquí el contenido de esta sección..."
                      />
                    </div>
                  ))}
                  <button className="default aero-btn-list" onClick={addSection} style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px", margin: "0 auto" }}>
                    <Plus size={18} /> Añadir Nueva Sección
                  </button>
                </div>
              </div>
            )}

            {activeTab === "checklist" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <h2 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px", marginTop: 0 }}>Checklists Interactivos</h2>
                <p style={{ color: "#666", fontSize: "14px" }}>Añade tareas a tus secciones. Los usuarios podrán marcarlas a medida que juegan.</p>
                
                {sections.map((sec, index) => (
                  <div key={sec.id} style={{ borderLeft: "4px solid #3b82f6", paddingLeft: "15px", marginBottom: "30px" }}>
                    <h3 style={{ margin: "0 0 15px 0", color: "#1e293b" }}>{sec.title || `Sección ${index + 1} (Sin Título)`}</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {sec.checklists.map((check) => (
                        <div key={check.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input type="checkbox" disabled style={{ width: "18px", height: "18px" }} />
                          <input 
                            type="text" value={check.text} onChange={e => updateChecklist(sec.id, check.id, e.target.value)}
                            style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} placeholder="Ej: Encontrar el anillo de Havel"
                          />
                          <button onClick={() => removeChecklist(sec.id, check.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "5px" }}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button 
                        onClick={() => addChecklist(sec.id)} 
                        style={{ alignSelf: "flex-start", marginTop: "5px", background: "none", border: "none", color: "#3b82f6", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                      >
                        <Plus size={16} /> Añadir tarea
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}