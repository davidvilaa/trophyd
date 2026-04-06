"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import GameCard3D from "@/components/gameCard3D";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { MoveLeft, MoveRight, X, House, FileEdit } from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";

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

  const { showNotification } = useNotification();

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
          <div 
            className="window glass active" 
            style={{ 
              position: "absolute", 
              top: "30px",
              width: "90%", 
              maxWidth: "1100px", 
              zIndex: 120 
            }}
          >
            <div className="title-bar">
              <div className="title-bar-text" style={{ fontSize: "14px" }}>
              </div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close" onClick={() => { setFocusedGame(null); setIsLogging(false); }}></button>
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 105 }}>
            <GameCard3D 
              coverUrl={focusedGame.portada} 
              consola={consolaFocus}
              isFocused={true} 
              isLogging={isLogging}
              juego={focusedGame} 
              userId={userId}
              onSaveSuccess={(action) => {
                setIsLogging(false); 
                setFocusedGame(null);
                showNotification(
                  action === "deleted" ? "¡Juego Borrado!" : "¡Juego Actualizado!",
                  action === "deleted" 
                    ? `Has eliminado ${focusedGame.titulo} de tu colección.` 
                    : `Has actualizado ${focusedGame.titulo} con éxito.`
                );
              }}
              onPlatformFetched={(plat) => setConsolaFocus(plat)} 
            />
          </div>

          <div className="window" style={{ zIndex: 110, width: "auto", padding: "10px", position: "relative" }}>
            <div className="window-body" style={{ display: "flex", gap: "10px", alignItems: "center", margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0", marginRight: "10px", height: "35px" }}>
                <button 
                  onClick={() => {
                    const consolas = focusedGame.todasLasConsolas?.length > 0 ? focusedGame.todasLasConsolas : ["pc"];
                    const index = consolas.indexOf(consolaFocus || "pc");
                    const prevIndex = index <= 0 ? consolas.length - 1 : index - 1;
                    setConsolaFocus(consolas[prevIndex]);
                  }}
                  style={{ width: "35px", height: "100%", cursor: "pointer", padding: 0, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}
                >
                  <MoveLeft size={18} />
                </button>

                <select 
                  value={consolaFocus || "pc"} 
                  onChange={(e) => setConsolaFocus(e.target.value)}
                  style={{ width: "160px", height: "100%", cursor: "pointer", padding: "0 10px", margin: 0, boxSizing: "border-box", borderRadius: 0 }}
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
                  style={{ width: "35px", height: "100%", cursor: "pointer", padding: 0, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}
                >
                  <MoveRight size={18} />
                </button>
              </div>

              <button 
                onClick={() => router.push(`/game/${focusedGame.id}`)}
                style={{ 
                  minWidth: "35px", height: "35px", padding: 0, cursor: "pointer", 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxSizing: "border-box"
                }}
                title="Ver Ficha Técnica"
              >
                <House size={18} />
              </button>

              <button 
                onClick={() => setIsLogging(!isLogging)}
                className={isLogging ? "active" : ""}
                style={{ 
                  minWidth: "35px", height: "35px", padding: 0, cursor: "pointer", 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: isLogging ? "#e3e3e3" : "",
                  boxShadow: isLogging ? "inset 0 2px 4px rgba(0,0,0,0.25)" : "",
                  boxSizing: "border-box"
                }}
                title={isLogging ? "Volver a Portada" : "Loguear Juego"}
              >
                {isLogging ? <MoveLeft size={18} /> : <FileEdit size={18} />}
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
    </main>
  );
}