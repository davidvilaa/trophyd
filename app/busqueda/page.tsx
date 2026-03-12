"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import GameCard3D from "@/components/gameCard3D";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import {MoveLeft, MoveRight} from "lucide-react";

export default function BusquedaPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [focusedGame, setFocusedGame] = useState<any | null>(null);
  const [consolaFocus, setConsolaFocus] = useState<string | null>(null);
  
  const [juegos, setJuegos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const mainRef = useRef<HTMLElement>(null!);
  const observerTarget = useRef<HTMLDivElement>(null);

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
        console.error("Error en búsqueda inicial:", error);
      } finally {
        setCargando(false);
      }
    };

    buscarInicial();
  }, [query]);

  useEffect(() => {
    if (offset === 0 || !query || !hasMore) return;

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
        console.error("Error cargando más juegos:", error);
      } finally {
        setCargando(false);
      }
    };

    buscarMas();
  }, [offset, query, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !cargando) {
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
  }, [hasMore, cargando]);

  const handleBoxClick = (juego: any) => {
    setFocusedGame(juego);
    setConsolaFocus(juego.consola);
  };

  return (
    <main ref={mainRef} style={{ padding: "100px 20px 40px", minHeight: "100vh", position: "relative" }}>

      <div style={{
        maxWidth: "1100px", margin: "0 auto", display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", 
        gap: "30px 15px", justifyItems: "center"
      }}>
        {juegos.map((juego, index) => (
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
        ))}
      </div>

      <div ref={observerTarget} style={{ height: "20px", width: "100%", marginTop: "20px" }}>
        {cargando && <p style={{ textAlign: "center", color: "white" }}>Cargando más juegos...</p>}
      </div>

      {focusedGame && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(5px)", // !!
          zIndex: 100, display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center"
        }}>
          
          <button 
            onClick={() => setFocusedGame(null)}
            style={{ position: "absolute", top: "30px", right: "40px", zIndex: 110, padding: "5px 15px", cursor: "pointer" }}
          >
            Cerrar
          </button>

          <div style={{ width: "350px", height: "500px", marginBottom: "15px" }}>
            <GameCard3D 
              coverUrl={focusedGame.portada} 
              consola={consolaFocus}
              isFocused={true} 
            />
          </div>

          <h2 style={{ color: "white", fontSize: "2rem", marginBottom: "20px", textAlign: "center", textShadow: "0 2px 5px rgba(0,0,0,0.8)" }}>
            {focusedGame.titulo}
          </h2>

          <div className="window" style={{ zIndex: 110, width: "auto", padding: "10px" }}>
            <div className="window-body" style={{ display: "flex", gap: "20px", alignItems: "center", margin: 0 }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <button 
                  onClick={() => {
                    const consolas = focusedGame.todasLasConsolas?.length > 0 ? focusedGame.todasLasConsolas : ["pc"];
                    const index = consolas.indexOf(consolaFocus || "pc");
                    const prevIndex = index <= 0 ? consolas.length - 1 : index - 1;
                    setConsolaFocus(consolas[prevIndex]);
                  }}
                  style={{ minWidth: "30px", cursor: "pointer" }}
                >
                  <MoveLeft/>
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
                  style={{ minWidth: "30px", cursor: "pointer" }}
                >
                  <MoveRight/>
                </button>
              </div>

              <button 
                onClick={() => alert("¡Siguiente paso: Girar 180º y mostrar el form!")}
                style={{ fontWeight: "bold", padding: "5px 15px", cursor: "pointer" }}
              >
                Loguear Juego
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