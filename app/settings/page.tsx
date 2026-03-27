"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Draggable from "react-draggable";

export default function ConfigPage() {
  const router = useRouter();
  const nodeRef = useRef(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [pfpUrl, setPfpUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [correoActualForm1, setCorreoActualForm1] = useState("");
  const [passActualForm1, setPassActualForm1] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [correoActualForm2, setCorreoActualForm2] = useState("");
  const [passActualForm2, setPassActualForm2] = useState("");
  const [nuevaPass, setNuevaPass] = useState("");
  
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
      setCorreoActualForm1(session.user.email || "");

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
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error al guardar el perfil" });
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEmail = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: correoActualForm1,
        password: passActualForm1,
      });

      if (authError) throw new Error("Las credenciales actuales son incorrectas.");

      const { error: updateError } = await supabase.auth.updateUser({ email: nuevoCorreo });
      if (updateError) throw updateError;

      setMensaje({ tipo: "exito", texto: "¡Email actualizado! Revisa la bandeja de entrada del NUEVO correo para confirmarlo." });
      
      setCorreoActualForm1(""); setPassActualForm1(""); setNuevoCorreo("");
    } catch (error: any) {
      setMensaje({ tipo: "error", texto: error.message || "Error al cambiar el email." });
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarPassword = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: correoActualForm2,
        password: passActualForm2,
      });

      if (authError) throw new Error("El correo o contraseña actuales son incorrectos.");

      const { error: updateError } = await supabase.auth.updateUser({ password: nuevaPass });
      if (updateError) throw updateError;

      setMensaje({ tipo: "exito", texto: "¡Contraseña actualizada con éxito!" });
      
      setCorreoActualForm2(""); setPassActualForm2(""); setNuevaPass("");
    } catch (error: any) {
      setMensaje({ tipo: "error", texto: error.message || "Error al cambiar la contraseña." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://wallpapers.com/images/hd/artistic-blue-windows-7-cover-v0qwgn3ypat2bloy.jpg')] bg-cover bg-center overflow-hidden">
      
      <Draggable handle=".title-bar" nodeRef={nodeRef}>
        <div ref={nodeRef} className="window glass active" style={{ width: "100%", maxWidth: "700px", position: "absolute" }}>
          
          <div className="title-bar" style={{ cursor: "grab" }}>
            <div className="title-bar-text">Ajustes</div>
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
              <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>                
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", width: "100px", gap: "10px" }}>
                  <div style={{ 
                    width: "80px", height: "80px", border: "2px inset #fff", backgroundColor: "#ccc",
                    backgroundImage: `url(${pfpUrl || 'https://www.gravatar.com/avatar/0?d=mp&f=y'})`,
                    backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0
                  }}></div>
                  
                  <input type="file" id="avatar-upload" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
                  <button onClick={() => document.getElementById("avatar-upload")?.click()} disabled={uploadingAvatar} style={{ width: "100%" }}>
                    {uploadingAvatar ? "Subiendo" : "Cambiar foto"}
                  </button>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label htmlFor="nickname" style={{ width: "70px", textAlign: "right", marginRight: "10px" }}>
                      Nickname:
                    </label>
                    <input 
                      id="nickname" 
                      type="text" 
                      value={nickname} 
                      onChange={(e) => setNickname(e.target.value)}
                      style={{ flex: 1, fontFamily: "inherit", boxSizing: "border-box" }}
                    />
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "flex-start", flex: 1, marginTop: "10px" }}>
                    <label htmlFor="bio" style={{ width: "70px", textAlign: "right", marginRight: "10px", marginTop: "4px" }}>
                      Bio:
                    </label>
                    <textarea 
                      id="bio" 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                      style={{ flex: 1, resize: "none", fontFamily: "inherit", boxSizing: "border-box", height: "100%" }}
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
              <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
                <fieldset style={{ flex: 1, padding: "15px", display: "flex", flexDirection: "column", margin: 0 }}>
                  <legend>Cambiar Correo</legend>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                    <div className="field-row-stacked" style={{ margin: 0 }}>
                      <label style={{ color: "#000000" }}>Correo Actual:</label>
                      <input type="email" value={correoActualForm1} onChange={(e) => setCorreoActualForm1(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                    </div>
                    
                    <div className="field-row-stacked" style={{ margin: 0 }}>
                      <label style={{ color: "#000000" }}>Contraseña Actual:</label>
                      <input type="password" value={passActualForm1} onChange={(e) => setPassActualForm1(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                    </div>
                    
                    <div className="field-row-stacked" style={{ margin: 0, marginTop: "5px" }}>
                      <label style={{ fontWeight: "bold", color: "#000000" }}>Nuevo Correo:</label>
                      <input type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto", paddingTop: "15px" }}>
                      <button onClick={handleCambiarEmail} disabled={loading} style={{ width: "145px" }}>
                        Actualizar Correo
                      </button>
                    </div>
                  </div>
                </fieldset>

                <fieldset style={{ flex: 1, padding: "15px", display: "flex", flexDirection: "column", margin: 0 }}>
                  <legend>Cambiar Contraseña</legend>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                    <div className="field-row-stacked" style={{ margin: 0 }}>
                      <label style={{ color: "#000000" }}>Correo Actual:</label>
                      <input type="email" value={correoActualForm2} onChange={(e) => setCorreoActualForm2(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                    </div>
                    
                    <div className="field-row-stacked" style={{ margin: 0 }}>
                      <label style={{ color: "#000000" }}>Contraseña Actual:</label>
                      <input type="password" value={passActualForm2} onChange={(e) => setPassActualForm2(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                    </div>
                    
                    <div className="field-row-stacked" style={{ margin: 0, marginTop: "5px" }}>
                      <label style={{ fontWeight: "bold", color: "#000000" }}>Nueva Contraseña:</label>
                      <input type="password" value={nuevaPass} onChange={(e) => setNuevaPass(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto", paddingTop: "15px" }}>
                      <button onClick={handleCambiarPassword} disabled={loading} style={{ width: "145px" }}>
                        Actualizar Contraseña
                      </button>
                    </div>
                  </div>
                </fieldset>
              </div>
            </fieldset>
          </div>
        </div>
      </Draggable>
    </div>
  );
}