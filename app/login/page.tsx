"use client";

import { useState, useRef } from "react"; 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Draggable from "react-draggable";
import { Trophy } from "lucide-react";

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
      setError("Correo o contraseña incorrectos");
      setLoading(false);
      return;
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://wallpapers.com/images/hd/artistic-blue-windows-7-cover-v0qwgn3ypat2bloy.jpg')] bg-cover bg-center overflow-hidden">
      
      <style>{`
        .btn-gelatina {
          background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 49%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.2) 100%) !important;
          border: 1px solid #707070 !important;
          transition: all 0.1s ease;
          cursor: pointer;
          color: #000 !important;
        }

        .btn-gelatina:hover:not(:disabled) {
          filter: brightness(1.05);
          box-shadow: inset 0 0 5px rgba(255,255,255,0.5), 0 0 8px rgba(59, 130, 246, 0.4) !important;
        }

        .btn-gelatina:active:not(:disabled) {
          transform: translateY(1px);
          background-image: linear-gradient(0deg, rgba(255, 255, 255, 0.2) 0%, rgba(0, 0, 0, 0.1) 100%) !important;
        }

        .form-row {
          display: grid;
          grid-template-columns: 60px 1fr; 
          align-items: center;
          gap: 10px;
          width: 100%;
        }
      `}</style>

      <Draggable handle=".title-bar" nodeRef={nodeRef}>
        
        <div ref={nodeRef} className="window glass active" style={{ width: "100%", maxWidth: "420px" }}>
          
          <div className="title-bar" style={{ cursor: "grab" }}>
            <div className="title-bar-text">Autenticación de Usuario - Trophyd</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close" onClick={() => router.push("/")}></button>
            </div>
          </div>

          <div className="window-body has-space" style={{ padding: "20px" }}>
            
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "25px" }}>
              <Trophy style={{ width: "40px", height: "40px", color: "#BBBBBB", filter: "drop-shadow(0 2px 2px rgba(255,255,255,0.6))" }} />
              <span style={{ fontSize: "2rem", fontWeight: "900", color: "#000", textShadow: "0 0 5px rgba(255,255,255,0.8), 0 1px 1px rgba(255,255,255,1)" }}>
                Trophy<span style={{ color: "#BBBBBB" }}>d</span>
              </span>
            </div>

            {error && (
              <div style={{ color: "red", marginBottom: "15px", fontWeight: "bold", padding: "10px", backgroundColor: "rgba(255,0,0,0.1)", border: "1px solid red", textAlign: "center" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
              
              <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "12px" }}>
                
                <div className="form-row">
                  <label htmlFor="email" style={{ fontSize: "12px", fontWeight: "bold", color: "#333", textAlign: "left" }}>Email:</label>
                  <input 
                    id="email" type="email" required 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    style={{ width: "100%", padding: "6px 8px", boxSizing: "border-box" }}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="password" style={{ fontSize: "12px", fontWeight: "bold", color: "#333", textAlign: "left" }}>Pass:</label>
                  <input 
                    id="password" type="password" required 
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", boxSizing: "border-box" }}
                  />
                </div>

              </div>

              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px", marginTop: "5px" }}>
                <button type="submit" className="default btn-gelatina" disabled={loading} style={{ width: "100%", height: "38px", fontSize: "14px" }}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </button>
                
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0,0,0,0.1)" }}></div>
                    <span style={{ fontSize: "11px", color: "#666", whiteSpace: "nowrap" }}>o si no tienes cuenta</span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0,0,0,0.1)" }}></div>
                </div>

                <Link href="/register" style={{ width: "100%" }}>
                  <button type="button" className="btn-gelatina" style={{ width: "100%", height: "32px" }}>Crear una cuenta nueva</button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </Draggable>
    </div>
  );
}