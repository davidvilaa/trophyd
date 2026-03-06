"use client";

import { useState } from "react";
import GameCard3D from "@/components/gameCard3D";

const JUEGOS_PRUEBA = [
  { 
    id: 1, 
    titulo: "GTA San Andreas", 
    portada: "https://i.imgur.com/QDVyGAO.png"
  },
  {
    id: 2,
    titulo: "The Witcher 3",
    portada: "https://i.imgur.com/QDVyGAO.png"
  },
  {
    id: 3,
    titulo: "The Witcher 3",
    portada: "https://i.imgur.com/QDVyGAO.png"
  },
  {
    id: 4,
    titulo: "The Witcher 3",
    portada: "https://i.imgur.com/QDVyGAO.png"
  }
];

export default function BusquedaPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [juegoSeleccionado, setJuegoSeleccionado] = useState<string | null>(null);

  const handleBoxClick = (titulo: string) => {
    console.log(`Abriendo carcasa de ${titulo}...`);
    setJuegoSeleccionado(titulo);
    setIsOpen(true);
  };

  return (
    <main style={{ 
      padding: "100px 20px 40px",
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #f0f7ff, #ffffff)" // Fondo sutil Aero
    }}>
      
      <div style={{ maxWidth: "1200px", margin: "0 auto", marginBottom: "30px" }} className="window glass">
        <div className="title-bar">
          <div className="title-bar-text">Resultados de Búsqueda</div>
        </div>
        <div className="window-body">
          <p>Se han encontrado {JUEGOS_PRUEBA.length} juegos.</p>
        </div>
      </div>

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
        gap: "50px",
        justifyItems: "center"
      }}>
        {JUEGOS_PRUEBA.map((juego) => (
          <div key={juego.id} style={{ 
            width: "100%", 
            height: "500px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "visible"
          }}>
            <GameCard3D 
              coverUrl={juego.portada} 
              onClick={() => handleBoxClick(juego.titulo)} 
            />
          </div>
        ))}
      </div>

      {isOpen && juegoSeleccionado && (
        <div className="window glass" style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 100,
          width: "350px",
          boxShadow: "0 0 50px rgba(0,0,0,0.5)"
        }}>
          <div className="title-bar">
            <div className="title-bar-text">Loguear {juegoSeleccionado}</div>
            <div className="title-bar-controls">
              <button aria-label="Close" onClick={() => setIsOpen(false)}></button>
            </div>
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