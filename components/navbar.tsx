"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Gamepad2, User, Settings, LogOut, ChevronDown } from "lucide-react"; 

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [username, setUsername] = useState<string | null>(null);

useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('nickname') 
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (error) {
          console.error("Error al sacar el perfil:", error);
        }
          
        setUsername(profile?.nickname || session.user.email);
      } else {
        setUser(null);
        setUsername(null);
      }
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName = username;

  return (
    <nav style={{
      background: "linear-gradient(to bottom, rgba(175, 205, 245, 0.4) 0%, rgba(135, 175, 225, 0.3) 100%)",
      backdropFilter: "blur(12px) saturate(150%)",
      WebkitBackdropFilter: "blur(12px) saturate(150%)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.6)",
      borderTop: "1px solid rgba(255, 255, 255, 0.8)",
      boxShadow: "0 4px 15px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.1)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <Gamepad2 style={{ width: "32px", height: "32px", color: "#8CB4BA", filter: "drop-shadow(0 2px 2px rgba(255,255,255,0.6))" }} />
          <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "#000", textShadow: "0 0 5px rgba(255,255,255,0.8), 0 1px 1px rgba(255,255,255,1)" }}>
            Trophy<span style={{ color: "#8CB4BA" }}>d</span>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {loading ? (
            <div style={{ width: "100px", height: "30px" }}></div>
          ) : !user ? (
            <section className="field-row" style={{ display: "flex", margin: 0, gap: "15px" }}>
              <Link href="/login">
                <button type="button">Login</button>
              </Link>
              <Link href="/register">
                <button className="default">Registro</button>
              </Link>
            </section>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
              <div className="searchbox" style={{ marginLeft: "20px", marginRight: "auto", display: "flex", height: "28px"}}>
                <input type="search" placeholder="Buscar juegos..." style={{ height: "100%" }} />
                <button aria-label="search" style={{ height: "93%" }}></button>
              </div>
              <button 
                type="button" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "4px 8px" }}
              >
                <User size={16} color="#0044aa" />
                <strong style={{ fontSize: "14px", color: "#000", textShadow: "0 0 3px rgba(255,255,255,0.8)" }}>
                  {displayName}
                </strong>
                <ChevronDown size={14} style={{ color: "#000" }} />
              </button>

              {isMenuOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  minWidth: "150px",
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
                  borderRadius: "4px",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  zIndex: 100
                }}>
                  
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                    <button type="button" style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}>
                      <User size={14} /> Perfil
                    </button>
                  </Link>

                  <Link href="/settings" onClick={() => setIsMenuOpen(false)}>
                    <button type="button" style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Settings size={14} /> Ajustes
                    </button>
                  </Link>

                  <hr style={{ margin: "2px 0", border: "none", borderTop: "1px solid rgba(0,0,0,0.1)", borderBottom: "1px solid rgba(255,255,255,0.5)" }} />

                  <button type="button" onClick={handleLogout} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", color: "darkred" }}>
                    <LogOut size={14} /> Salir
                  </button>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}