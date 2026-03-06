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

    const buscarEnRAWG = async () => {
      setCargando(true);
      try {
        const url = `https://api.rawg.io/api/games?key=37f663c1b5d94dbe917b9cdf3f14c231&search=${query}&page_size=12`;
        
        const respuesta = await fetch(url);
        const datos = await respuesta.json();

        const juegosFormateados = datos.results.map((juego: any) => ({
          id: juego.id,
          titulo: juego.name,
          portada: juego.background_image || "https://via.placeholder.com/300x400?text=Sin+Portada" 
        }));

        setJuegos(juegosFormateados);
      } catch (error) {
        console.error("Error buscando juegos:", error);
      } finally {
        setCargando(false);
      }
    };

    buscarEnRAWG();
  }, [query]);

  const handleBoxClick = (titulo: string) => {
    setJuegoSeleccionado(titulo);
    setIsOpen(true);
  };

  return (
    <main style={{ padding: "100px 20px 40px", minHeight: "100vh" }}>
      
      <div style={{ maxWidth: "1100px", margin: "0 auto 30px", textAlign: "center" }}>
        <h2>{cargando ? "Buscando en la base de datos secreta..." : query ? `Resultados para: "${query}"` : "Busca un juego en la barra superior"}</h2>
      </div>

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
            <GameCard3D 
              coverUrl={juego.portada} 
              onClick={() => handleBoxClick(juego.titulo)} 
            />
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