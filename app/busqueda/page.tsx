"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import GameCard3D from "@/components/gameCard3D";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { MoveLeft, MoveRight, X } from "lucide-react";

export default function BusquedaPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [activeTab, setActiveTab] = useState("games");

  const [focusedGame, setFocusedGame] = useState<any | null>(null);
  const [consolaFocus, setConsolaFocus] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  
  const [juegos, setJuegos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  const mainRef = useRef<HTMLElement>(null!);
  const observerTarget = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [notificacion, setNotificacion] = useState<{ titulo: string, mensaje: string } | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const comprobarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/");
      } else {
        setUserId(session.user.id);
      }
    };

    comprobarSesion();
  }, [router]);

  useEffect(() => {
    if (!query) return;

    const buscarInicial = async () => {
      setCargando(true);
      try {
        const respuesta = await fetch(`/api/igdb?q=${query}&offset=0`);
        const datos = await respuesta.json();

        if (Array.isArray(datos)) {
          setJuegos(datos);
          setOffset(0);
          setHasMore(datos.length > 0); 
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    const buscarUsuarios = async () => {
      setCargandoUsuarios(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, nickname, pfp_url")
          .ilike("nickname", `%${query}%`);
        
        if (data) {
          setUsuarios(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCargandoUsuarios(false);
      }
    };

    buscarInicial();
    buscarUsuarios();
  }, [query]);

  useEffect(() => {
    if (offset === 0 || !query || !hasMore || activeTab !== "games") return;

    const buscarMas = async () => {
      setCargando(true);
      try {
        const respuesta = await fetch(`/api/igdb?q=${query}&offset=${offset}`);
        const datos = await respuesta.json();

        if (Array.isArray(datos)) {
          if (datos.length === 0) {
            setHasMore(false);
          } else {
            setJuegos((prev) => [...prev, ...datos]);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    buscarMas();
  }, [offset, query, hasMore, activeTab]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !cargando && activeTab === "games") {
          setOffset((prevOffset) => prevOffset + 20);
        }
      },
      { rootMargin: "200px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore, cargando, activeTab]);

  useEffect(() => {
    if (focusedGame) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [focusedGame]);

  const handleBoxClick = (juego: any) => {
    setFocusedGame(juego);
    setConsolaFocus(juego.consola);
  };

  const cerrarNotificacion = () => {
    setIsClosing(true);
    setTimeout(() => {
      setNotificacion(null);
      setIsClosing(false);
    }, 500);
  };

  return (
    <main ref={mainRef} style={{ padding: "100px 20px 40px", minHeight: "100vh", position: "relative" }}>

      <div style={{ maxWidth: "1100px", margin: "0 auto", marginBottom: "30px", position: "relative", zIndex: 9999 }}>
        <style>{`
          .tab-activa,
          [role="menubar"] [role="menuitem"]:hover,
          [role="menubar"] [role="menuitem"]:focus,
          [role="menubar"] [role="menuitem"]:active {
            background: linear-gradient(to bottom, rgba(175, 205, 245, 0.4) 0%, rgba(135, 175, 225, 0.4) 100%) !important;
            color: #000 !important;
            border-radius: 3px;
            box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.05) !important;
            outline: none !important;
          }
          .user-card {
            transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
            cursor: pointer;
            position: relative;
          }
          .user-card:hover { 
            transform: scale(1.05); 
            box-shadow: 0 10px 20px rgba(0,0,0,0.25) !important;
            z-index: 10;
          }
        `}</style>
        
        <ul role="menubar" style={{ fontSize: "16px", backgroundColor: "#fff", position: "relative" }}>
          <li role="menuitem" tabIndex={0} onClick={() => setActiveTab("games")} className={activeTab === "games" ? "tab-activa" : ""}>
            Juegos ({juegos.length}{hasMore && juegos.length > 0 ? "+" : ""})
          </li>
          <li role="menuitem" tabIndex={0} onClick={() => setActiveTab("users")} className={activeTab === "users" ? "tab-activa" : ""}>
            Usuarios ({usuarios.length})
          </li>
        </ul>
      </div>

      {activeTab === "games" && (
        <>
          <div style={{
            maxWidth: "1100px", margin: "0 auto", display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", 
            gap: "30px 15px", justifyItems: "center"
          }}>
            {juegos.map((juego, index) => {
              if (!juego) return null; 

              return (
                <div key={`${juego.id}-${index}`} style={{ 
                  width: "100%", height: "280px", display: "flex",
                  justifyContent: "center", alignItems: "center", position: "relative"
                }}>
                  <GameCard3D 
                    coverUrl={juego.portada} 
                    consola={juego.consola}
                    onClick={() => handleBoxClick(juego)}
                  />
                </div>
              );
            })}
          </div>

          <div ref={observerTarget} style={{ height: "20px", width: "100%", marginTop: "20px" }}>
            {cargando && <p style={{ textAlign: "center", color: "white", fontWeight: "bold" }}>Cargando más juegos...</p>}
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {cargandoUsuarios ? (
            <p style={{ textAlign: "center", color: "white", fontWeight: "bold" }}>Buscando usuarios...</p>
          ) : usuarios.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {usuarios.map(user => (
                <div 
                  key={user.id} 
                  className="window user-card" 
                  onClick={() => router.push(`/profile/${user.nickname}`)} 
                  style={{ padding: "10px", margin: 0 }}
                >
                  <div className="window-body" style={{ display: "flex", alignItems: "center", gap: "15px", margin: 0 }}>
                    <div style={{ 
                      width: "50px", height: "50px", flexShrink: 0,
                      border: "2px inset #fff", backgroundColor: "#ccc",
                      backgroundImage: `url(${user.pfp_url || 'https://www.gravatar.com/avatar/0?d=mp&f=y'})`, 
                      backgroundSize: "cover", backgroundPosition: "center"
                    }}></div>
                    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <span style={{ fontWeight: "bold", fontSize: "16px", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                        {user.nickname}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "white", fontWeight: "bold" }}>
              No se encontraron usuarios con "{query}".
            </p>
          )}
        </div>
      )}

      {focusedGame && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(5px)",
          zIndex: 100000, 
          display: "flex", flexDirection: "column",
          justifyContent: "flex-end", 
          alignItems: "center",
          paddingBottom: "30px" 
        }}>
          
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 105 }}>
            <GameCard3D 
              coverUrl={focusedGame.portada} 
              consola={consolaFocus}
              isFocused={true} 
              isLogging={isLogging}
              juego={focusedGame} 
              userId={userId}
              onSaveSuccess={() => {
                setIsLogging(false); 
                setFocusedGame(null);
                setIsClosing(false); 
                setNotificacion({
                  titulo: "¡Juego Guardado!",
                  mensaje: `Has añadido ${focusedGame.titulo} a tu colección con éxito.`
                });
                setTimeout(() => cerrarNotificacion(), 3000);
              }} 
            />
          </div>

          <div className="window" style={{ zIndex: 110, width: "auto", padding: "10px", position: "relative" }}>
            <div className="window-body" style={{ display: "flex", gap: "15px", alignItems: "center", margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <button 
                  onClick={() => {
                    const consolas = focusedGame.todasLasConsolas?.length > 0 ? focusedGame.todasLasConsolas : ["pc"];
                    const index = consolas.indexOf(consolaFocus || "pc");
                    const prevIndex = index <= 0 ? consolas.length - 1 : index - 1;
                    setConsolaFocus(consolas[prevIndex]);
                  }}
                  style={{ minWidth: "30px", cursor: "pointer", padding: "2px" }}
                >
                  <MoveLeft size={18} />
                </button>

                <select 
                  value={consolaFocus || "pc"} 
                  onChange={(e) => setConsolaFocus(e.target.value)}
                  style={{ minWidth: "160px", cursor: "pointer", padding: "3px" }}
                >
                  {focusedGame.todasLasConsolas && focusedGame.todasLasConsolas.length > 0 ? (
                    focusedGame.todasLasConsolas.map((c: string) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))
                  ) : (
                    <option value="pc">PC</option>
                  )}
                </select>

                <button 
                  onClick={() => {
                    const consolas = focusedGame.todasLasConsolas?.length > 0 ? focusedGame.todasLasConsolas : ["pc"];
                    const index = consolas.indexOf(consolaFocus || "pc");
                    const nextIndex = index >= consolas.length - 1 ? 0 : index + 1;
                    setConsolaFocus(consolas[nextIndex]);
                  }}
                  style={{ minWidth: "30px", cursor: "pointer", padding: "2px" }}
                >
                  <MoveRight size={18} />
                </button>
              </div>

              <button 
                onClick={() => setIsLogging(!isLogging)}
                style={{ fontWeight: "bold", padding: "5px 15px", cursor: "pointer" }}
              >
                {isLogging ? "Volver a Portada" : "Loguear Juego"}
              </button>

              <button 
                onClick={() => { setFocusedGame(null); setIsLogging(false); }}
                style={{ 
                  minWidth: "40px", 
                  padding: "4px", 
                  cursor: "pointer", 
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title="Cerrar Focus"
              >
                <X size={20} strokeWidth={4} />
              </button>

            </div>
          </div>
        </div>
      )}

      <Canvas
        eventSource={mainRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 10 }}
        camera={{ position: [0, 0, 22], fov: 20 }}
      >
        <View.Port />
      </Canvas>
      {notificacion && (
        <div 
          style={{ 
            position: "fixed", top: "80px", left: "20px", 
            zIndex: 9999, opacity: isClosing ? 0 : 1, transition: "opacity 0.5s ease-in-out", 
          }}
        >
          <div role="tooltip" style={{ position: "relative", width: "660px", maxWidth: "90vw" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px", color: "#000" }}>
                {notificacion.titulo}
              </span>
              
              <button 
                onClick={() => setNotificacion(null)}
                style={{ minWidth: "20px", height: "20px", padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "12px", color: "#333", lineHeight: "1.4" }}>
              {notificacion.mensaje}
            </p>

          </div>
        </div>
      )}
    </main>
  );
}