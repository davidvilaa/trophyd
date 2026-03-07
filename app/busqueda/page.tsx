"use client";

import { useState, useEffect} from "react";
import { useSearchParams } from "next/navigation";
import GameCard3D from "@/components/gameCard3D";

export default function BusquedaPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [isOpen, setIsOpen] = useState(false);
  const [juegoSeleccionado, setJuegoSeleccionado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [juegos, setJuegos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!query) return;

    const buscarEnIGDB = async () => {
      setCargando(true);
      try {
        const respuesta = await fetch(`/api/igdb?q=${query}`);
        const datos = await respuesta.json();

        if (Array.isArray(datos)) {
          setJuegos(datos);
        } else {
          console.error("El backend devolvió un error:", datos);
          setJuegos([]);
        }
      } catch (error) {
        console.error("Error buscando juegos:", error);
      } finally {
        setCargando(false);
      }
    };

    buscarEnIGDB();
  }, [query]);

  const handleBoxClick = (titulo: string) => {
    setJuegoSeleccionado(titulo);
    setIsOpen(true);
  };

  return (
    <main style={{ padding: "100px 20px 40px", minHeight: "100vh" }}>

      <div style={{
        maxWidth: "1100px", margin: "0 auto", display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", 
        gap: "30px 15px", justifyItems: "center"
      }}>
        {juegos.map((juego) => (
          <div key={juego.id} style={{ 
            width: "100%", height: "280px", display: "flex",
            justifyContent: "center", alignItems: "center", position: "relative"
          }}>
            <GameCard3D coverUrl={juego.portada} onClick={() => handleBoxClick(juego.titulo)} />
          </div>
        ))}
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
    </main>
  );
}