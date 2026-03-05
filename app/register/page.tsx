"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Draggable from "react-draggable";

export default function RegisterPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nodeRef = useRef(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            username: username,
          }
        ]);

      if (profileError) {
        setError("La cuenta se creó, pero hubo un error al guardar el nombre de usuario.");
        setLoading(false);
        return;
      }
    }

    alert("¡Cuenta creada con éxito, tete!");
    router.push("/"); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://wallpapers.com/images/hd/artistic-blue-windows-7-cover-v0qwgn3ypat2bloy.jpg')] bg-cover bg-center overflow-hidden">
      
      <Draggable handle=".title-bar" nodeRef={nodeRef}>
        
        <div ref={nodeRef} className="window glass active" style={{ width: "100%", maxWidth: "550px", position: "absolute" }}>
          
          <div className="title-bar" style={{ cursor: "grab" }}>
            <div className="title-bar-text">Registro de Completista - Trophyd</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>

          <div className="window-body has-space">
            {error && (
              <div style={{ color: "red", marginBottom: "15px", fontWeight: "bold", padding: "10px", backgroundColor: "rgba(255,0,0,0.1)", border: "1px solid red" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              
              <div className="field-row-stacked">
                <label htmlFor="username">Nombre de usuario:</label>
                <input 
                  id="username" type="text" required 
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="NinjaTrophy99"
                />
              </div>

              <div className="field-row-stacked">
                <label htmlFor="email">Dirección de E-mail:</label>
                <input 
                  id="email" type="email" required 
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="field-row-stacked">
                <label htmlFor="password">Contraseña (mínimo 6 caracteres):</label>
                <input 
                  id="password" type="password" required 
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <section className="field-row" style={{ justifyContent: "flex-end", marginTop: "15px" }}>
                <Link href="/login">
                  <button type="button">Ya tengo cuenta</button>
                </Link>
                <button type="submit" className="default" disabled={loading}>
                  {loading ? "Registrando..." : "Crear cuenta"}
                </button>
              </section>
            </form>

          </div>
        </div>
      </Draggable>
    </div>
  );
}