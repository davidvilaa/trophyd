"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import GameCard3D from "@/components/gameCard3D";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";

export default function BusquedaPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [isOpen, setIsOpen] = useState(false);
  const [juegoSeleccionado, setJuegoSeleccionado] = useState<string | null>(null);
  
  const [juegos, setJuegos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const mainRef = useRef<HTMLElement>(null!);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setJuegos([]);
    setOffset(0);
    setHasMore(true);
  }, [query]);

  const buscarEnIGDB = async (currentOffset: number) => {
    if (!query || cargando || !hasMore) return;
    
    setCargando(true);
    try {
      const respuesta = await fetch(`/api/igdb?q=${query}&offset=${currentOffset}`);
      const datos = await respuesta.json();

      if (Array.isArray(datos)) {
        if (datos.length === 0) {
          setHasMore(false);
        } else {
          setJuegos(prev => currentOffset === 0 ? datos : [...prev, ...datos]);
        }
      }
    } catch (error) {
      console.error("Error buscando juegos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    buscarEnIGDB(offset);
  }, [query, offset]);

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

  const handleBoxClick = (titulo: string) => {
    setJuegoSeleccionado(titulo);
    setIsOpen(true);
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
            <GameCard3D coverUrl={juego.portada} onClick={() => handleBoxClick(juego.titulo)} />
          </div>
        ))}
      </div>

      <div ref={observerTarget} style={{ height: "20px", width: "100%", marginTop: "20px" }}>
        {cargando && <p style={{ textAlign: "center", color: "white" }}>Cargando más juegos...</p>}
      </div>

      {isOpen && juegoSeleccionado && (
        <div className="window glass" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 100, width: "350px", boxShadow: "0 0 50px rgba(0,0,0,0.5)" }}>
          <div className="title-bar">
            <div className="title-bar-text">Loguear {juegoSeleccionado}</div>
            <div className="title-bar-controls"><button aria-label="Close" onClick={() => setIsOpen(false)}></button></div>
          </div>
          <div className="window-body">
            <p>Se ha abierto la carcasa. ¿Añadir a completados?</p>
            <section className="field-row" style={{justifyContent: 'flex-end'}}>
              <button onClick={() => setIsOpen(false)}>Cancelar</button>
              <button className="default" onClick={() => { alert("¡Guardado!"); setIsOpen(false); }}>Confirmar</button>
            </section>
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