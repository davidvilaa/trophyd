"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import GameCard3D from "@/components/gameCard3D";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";

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
          backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(15px)", // Cristal borroso oscuro
          zIndex: 100, display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center"
        }}>
          <button 
            onClick={() => setFocusedGame(null)}
            style={{ position: "absolute", top: "40px", right: "50px", fontSize: "30px", color: "white", background: "none", border: "none", cursor: "pointer", zIndex: 110 }}
          >
            ✕
          </button>

          <div style={{ width: "350px", height: "500px", marginBottom: "20px" }}>
            <GameCard3D 
              coverUrl={focusedGame.portada} 
              consola={consolaFocus}
              isFocused={true} 
            />
          </div>

          <h2 style={{ color: "white", fontSize: "2.5rem", marginBottom: "30px", textAlign: "center", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            {focusedGame.titulo}
          </h2>

          <div style={{ display: "flex", gap: "20px", alignItems: "center", zIndex: 110 }}>
            
            <select 
              value={consolaFocus || "pc"} 
              onChange={(e) => setConsolaFocus(e.target.value)}
              style={{ padding: "12px 20px", borderRadius: "10px", background: "#222", color: "white", border: "1px solid #555", fontSize: "16px", cursor: "pointer", outline: "none" }}
            >
              <option value="ps4">PlayStation 4</option>
              <option value="ps5">PlayStation 5</option>
              <option value="nds">Nintendo DS</option>
              <option value="ps1">PlayStation 1</option>
              <option value="gamecube">GameCube</option>
              <option value="xbox360">Xbox 360</option>
              <option value="pc">PC</option>
            </select>

            <button 
              onClick={() => alert("¡Siguiente paso: Girar 180º y mostrar el form!")}
              style={{ padding: "12px 30px", borderRadius: "10px", background: "#4ade80", color: "#111", border: "none", fontSize: "18px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 15px rgba(74, 222, 128, 0.4)" }}
            >
              Loguear Juego
            </button>
            
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