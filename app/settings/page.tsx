"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Draggable from "react-draggable";

export default function ConfigPage() {
  const router = useRouter();
  const nodeRef = useRef(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [pfpUrl, setPfpUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  
  const [mensaje, setMensaje] = useState<{ tipo: "error" | "exito", texto: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname, bio, pfp_url")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setNickname(profile.nickname || "");
        setBio(profile.bio || "");
        setPfpUrl(profile.pfp_url || "");
      }
    };

    cargarDatos();
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      setMensaje(null);
      
      const file = e.target.files?.[0];
      if (!file || !userId) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase.from("profiles").update({ pfp_url: publicUrl }).eq("id", userId);
      
      setPfpUrl(publicUrl);
      setMensaje({ tipo: "exito", texto: "¡Foto de perfil actualizada!" });

    } catch (error) {
      console.error(error);
      setMensaje({ tipo: "error", texto: "Error al subir la imagen" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleGuardarPerfil = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nickname, bio })
        .eq("id", userId);

      if (error) throw error;
      setMensaje({ tipo: "exito", texto: "¡Perfil guardado correctamente!" });
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error al guardar el perfil" });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarSeguridad = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      if (email) {
        const { error } = await supabase.auth.updateUser({ email: email });
        if (error) throw error;
      }
      
      if (newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword("");
      }

      setMensaje({ tipo: "exito", texto: "¡Datos de seguridad actualizados! (Revisa tu correo si cambiaste el email)" });
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error al actualizar la seguridad" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://wallpapers.com/images/hd/artistic-blue-windows-7-cover-v0qwgn3ypat2bloy.jpg')] bg-cover bg-center overflow-hidden">
      
      <Draggable handle=".title-bar" nodeRef={nodeRef}>
        <div ref={nodeRef} className="window glass active" style={{ width: "100%", maxWidth: "550px", position: "absolute" }}>
          
          <div className="title-bar" style={{ cursor: "grab" }}>
            <div className="title-bar-text">Panel de Control - Perfil</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close" onClick={() => router.push("/")}></button>
            </div>
          </div>

          <div className="window-body has-space">
            
            {mensaje && (
              <div style={{ 
                color: mensaje.tipo === "error" ? "#dc2626" : "#16a34a", 
                marginBottom: "10px", 
                fontWeight: "bold",
                backgroundColor: mensaje.tipo === "error" ? "#fee2e2" : "#dcfce3",
                padding: "5px",
                border: "1px solid",
                borderRadius: "3px"
              }}>
                {mensaje.texto}
              </div>
            )}

            <fieldset style={{ marginBottom: "15px", padding: "15px" }}>
              <legend>Información Pública</legend>
              <div style={{ display: "flex", gap: "20px" }}>
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100px" }}>
                  <div style={{ 
                    width: "80px", height: "80px", border: "2px inset #fff", backgroundColor: "#ccc",
                    backgroundImage: `url(${pfpUrl || 'https://www.gravatar.com/avatar/0?d=mp&f=y'})`,
                    backgroundSize: "cover", backgroundPosition: "center"
                  }}></div>
                  
                  <input type="file" id="avatar-upload" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
                  <button onClick={() => document.getElementById("avatar-upload")?.click()} disabled={uploadingAvatar}>
                    {uploadingAvatar ? "Subiendo..." : "Cambiar foto"}
                  </button>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="field-row-stacked">
                    <label htmlFor="nickname">Apodo (Nickname):</label>
                    <input 
                      id="nickname" type="text" 
                      value={nickname} onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>
                  
                  <div className="field-row-stacked">
                    <label htmlFor="bio">Sobre mí (Bio):</label>
                    <textarea 
                      id="bio" rows={3} style={{ resize: "none" }}
                      value={bio} onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>

              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <button onClick={handleGuardarPerfil} disabled={loading} className="default">
                  Guardar Perfil
                </button>
              </div>
            </fieldset>

            <fieldset style={{ padding: "15px" }}>
              <legend>Seguridad y Cuenta</legend>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="field-row-stacked">
                  <label htmlFor="config-email">Correo Electrónico:</label>
                  <input 
                    id="config-email" type="email" 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="field-row-stacked">
                  <label htmlFor="config-password">Nueva Contraseña (déjalo en blanco si no quieres cambiarla):</label>
                  <input 
                    id="config-password" type="password" 
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Escribe la nueva contraseña..."
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}>
                <button onClick={handleGuardarSeguridad} disabled={loading}>
                  Actualizar Credenciales
                </button>
              </div>
            </fieldset>

          </div>
        </div>
      </Draggable>

    </div>
  );
}