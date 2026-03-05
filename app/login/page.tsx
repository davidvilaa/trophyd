"use client";

import { useState, useRef } from "react"; 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Draggable from "react-draggable";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nodeRef = useRef(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email, password,
    });

    if (authError) {
      setError("Correo o contraseña incorrectos, bro.");
      setLoading(false);
      return;
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://wallpapers.com/images/hd/artistic-blue-windows-7-cover-v0qwgn3ypat2bloy.jpg')] bg-cover bg-center overflow-hidden">
      
      <Draggable handle=".title-bar" nodeRef={nodeRef}>
        
        <div ref={nodeRef} className="window glass active" style={{ width: "100%", maxWidth: "450px", position: "absolute" }}>
          
          <div className="title-bar" style={{ cursor: "grab" }}>
            <div className="title-bar-text">Iniciar Sesión - Trophyd</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>

          <div className="window-body has-space">
            {error && (
              <div style={{ color: "red", marginBottom: "10px", fontWeight: "bold" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="field-row-stacked">
                <label htmlFor="email">Dirección de E-mail:</label>
                <input 
                  id="email" type="email" required 
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="field-row-stacked">
                <label htmlFor="password">Contraseña:</label>
                <input 
                  id="password" type="password" required 
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <section className="field-row" style={{ justifyContent: "flex-end", marginTop: "10px" }}>
                <Link href="/register">
                  <button type="button">Crear cuenta</button>
                </Link>
                <button type="submit" className="default" disabled={loading}>
                  {loading ? "Entrando..." : "Aceptar"}
                </button>
              </section>
            </form>
          </div>
        </div>
      </Draggable>

    </div>
  );
}