"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float, ContactShadows, Environment, Center, View, Html } from "@react-three/drei";
import { supabase } from "@/lib/supabase";
import * as THREE from "three";

const AJUSTES_PORTADA: Record<string, { repeat: [number, number], offset: [number, number] }> = {
  "ps1": { repeat: [1.17, 1], offset: [-0.17, 0] },
  "ps2": {repeat: [1,1.07], offset: [0,-0.09]},
  "ps3": {repeat: [1,1], offset: [0,-0.08]},
  "ps4": {repeat: [1,1.1], offset: [0,-0.12]},
  "ps5": {repeat: [1,1.08], offset: [0,-0.11]},
  "psp": {repeat: [1,1.08], offset: [0,-0.1]},
  "psvita": {repeat: [1,1.06], offset: [0,-0.08]},
  "nes": {repeat: [1.2,1.75], offset: [-0.1,-0.13]},
  "snes": {repeat: [1,1.65], offset: [0,-0.36]},
  "n64": {repeat: [1.18,1], offset: [0.03,0]},
  "gamecube": {repeat: [1,0.97], offset: [0,-0.05]},
  "wii": {repeat: [1,0.98], offset: [0,0]},
  "wiiu": {repeat: [1,0.97], offset: [0,-0.03]},
  "switch": {repeat: [1,1], offset: [0,0]},
  "switch2": {repeat: [1,1], offset: [0,-0.1]},
  "gameboy": {repeat: [1.18,1], offset: [-0.18,0]},
  "gameboycolor": {repeat: [1.25,1], offset: [-0.25,0]},
  "gameboyadvance": {repeat: [1.1,1], offset: [-0.1,0]},
  "nds": {repeat: [1.18,1], offset: [-0.18,0]},
  "3ds": {repeat: [1.12,1], offset: [0,0]},
  "xbox": {repeat: [1,1.1], offset: [0,-0.12]},
  "xbox360": {repeat: [1,1.1], offset: [0,-0.13]},
  "xboxone": {repeat: [1,1.1], offset: [0,-0.15]},
  "xboxseriesxs": {repeat: [1,1.05], offset: [0,-0.1]},
  "pc": {repeat: [1,1.1], offset: [0,-0.12]}
};

const ESTILOS_GENERAL: Record<string, { color: string, roughness?: number, opacity?: number }> = {
  "ps1": { color: "#000000", roughness: 0.5},
  "ps2": { color: "#000000", roughness: 0.5},
  "ps3": { color: "#000000", roughness: 0.5},
  "ps4": { color: "#005988", roughness: 0.5, opacity: 0.8},
  "ps5": { color: "#005988", roughness: 0.5, opacity: 0.8},
  "psp": { color: "#000000", roughness: 0.5},
  "psvita": { color: "#005988", roughness: 0.5, opacity: 0.9},
  "nes": { color: "#000000", roughness: 0.5},
  "snes": { color: "#000000", roughness: 0.5},
  "n64": { color: "#52565a", roughness: 0.5, opacity: 0.4},
  "gamecube": { color: "#000000", roughness: 0.5},
  "wii": { color: "#ffffff", roughness: 0.5},
  "wiiu": { color: "#0889ce", roughness: 0.5, opacity: 0.8},
  "switch": { color: "#d72c2c", roughness: 0.5, opacity: 0.8},
  "switch2": { color: "#d72c2c", roughness: 0.5, opacity: 0.8},
  "gameboy": { color: "#52565a", roughness: 0.5, opacity: 0.4},
  "gameboycolor": { color: "#52565a", roughness: 0.5, opacity: 0.4},
  "gameboyadvance": { color: "#52565a", roughness: 0.5, opacity: 0.4},
  "nds": { color: "#ffffff", roughness: 0.5},
  "3ds": { color: "#ffffff", roughness: 0.5},
  "xbox": { color: "#75b034", roughness: 0.5},
  "xbox360": { color: "#75b034", roughness: 0.5},
  "xboxone": { color: "#75b034", roughness: 0.5},
  "xboxseriesxs": { color: "#75b034", roughness: 0.5},
  "pc": { color: "#52565a", roughness: 0.5, opacity: 0.4},
};

function Model({ url, coverUrl, hovered, consola, isFocused, isLogging, juego, userId, onSaveSuccess, onPlatformFetched }: { url: string, coverUrl?: string, hovered: boolean, consola: string | null, isFocused?: boolean, isLogging?: boolean, juego?: any, userId?: string | null, onSaveSuccess?: (action: "saved" | "deleted") => void, onPlatformFetched?: (platform: string) => void }) {
  const { scene } = useGLTF(url);
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  const meshRef = useRef<THREE.Group>(null);
  
  const consolaFinal = consola ? consola : "pc";
  const templatePath = `/models/${consolaFinal}/${consolaFinal}_1.png`;
  const lomoPath = `/models/${consolaFinal}/${consolaFinal}_2.png`;
  const contraPath = `/models/3ds/3ds_3.png`;

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [textureTemplate, setTextureTemplate] = useState<THREE.Texture | null>(null);
  const [textureLomo, setTextureLomo] = useState<THREE.Texture | null>(null);
  const [textureContra, setTextureContra] = useState<THREE.Texture | null>(null);

  const scrollY = useRef(0);
  
  const [isExisting, setIsExisting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0); 
  const [isFavorite, setIsFavorite] = useState(false);
  const [status, setStatus] = useState("completed");
  const [difficulty, setDifficulty] = useState(0);
  const [timePlayed, setTimePlayed] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [review, setReview] = useState("");

  useEffect(() => {
    const fetchGameData = async () => {
      if (isFocused && userId && juego) {
        try {
          const { data, error } = await supabase
            .from('user_games')
            .select('*')
            .eq('user_id', userId)
            .eq('game_id', juego.id)
            .single();

          if (data) {
            setIsExisting(true);
            setStatus(data.status || "completed");
            setDifficulty(data.difficulty || 0);
            setRating(data.rating || 0);
            setTimePlayed(data.time_played || 0);
            setIsFavorite(data.isFavorite || false);
            setStartDate(data.start_date || "");
            setEndDate(data.finish_date || "");
            setReview(data.review || "");
            if (data.platform && onPlatformFetched) {
              onPlatformFetched(data.platform);
            }
          } else {
            setIsExisting(false);
            setStatus("completed");
            setDifficulty(0);
            setRating(0);
            setTimePlayed(0);
            setIsFavorite(false);
            setStartDate("");
            setEndDate("");
            setReview("");
          }
        } catch (err) {
          console.error("No se encontró registro previo o hubo error", err);
        }
      }
    };

    fetchGameData();
  }, [isFocused, userId, juego]);

  useEffect(() => {
    if (!isLogging) {
      scrollY.current = 0;
    }
  }, [isLogging]);

  useEffect(() => {
    if (!isFocused) {
      scrollY.current = 0;
      return;
    }

    const handleWheel = (e: WheelEvent) => {
      if (!isLogging) return;
      const velocidad = 0.01;
      scrollY.current += e.deltaY * velocidad; 
      
      const limiteArriba = 4.5;  
      const limiteAbajo = 0;

      if (scrollY.current > limiteArriba) scrollY.current = limiteArriba;
      if (scrollY.current < limiteAbajo) scrollY.current = limiteAbajo;
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isFocused, isLogging]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    if (coverUrl) {
      loader.load(
        coverUrl, 
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.flipY = false;
          setTexture(tex);
        }, 
        undefined, 
        (err) => console.warn("Fallo al cargar foto de IGDB", coverUrl)
      );
    }

    loader.load(
      templatePath, 
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        setTextureTemplate(tex);
      },
      undefined,
      (err) => console.warn("Template no encontrado:", templatePath)
    );

    loader.load(
      lomoPath, 
      (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; setTextureLomo(tex); },
      undefined,
      (err) => console.warn("Lomo no encontrado:", lomoPath)
    );

    loader.load(
      contraPath, 
      (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; setTextureContra(tex); },
      undefined,
      (err) => console.warn("Contraportada no encontrada:", contraPath)
    );
  }, [coverUrl, templatePath, lomoPath, contraPath]);

  useEffect(() => {
    if (texture) {
      const ajuste = AJUSTES_PORTADA[consolaFinal] || { repeat: [1, 1], offset: [0, 0] };
      
      texture.center.set(0, 0); 
      texture.repeat.set(ajuste.repeat[0], ajuste.repeat[1]);
      texture.offset.set(ajuste.offset[0], ajuste.offset[1]);
      texture.needsUpdate = true;
    }

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const nombreOriginal = child.material.name;
        
        if (nombreOriginal === "PORTADA") { 
          child.material = new THREE.MeshStandardMaterial({ 
            name: nombreOriginal, 
            map: texture || null,
            color: texture ? "#ffffff" : "#222222",
            roughness: 0.3,
          });
        } 
        else if (nombreOriginal === "T_PORTADA") {
          child.visible = true; 
          child.material = new THREE.MeshStandardMaterial({ 
            name: nombreOriginal, 
            map: textureTemplate || null, 
            transparent: true, 
            alphaTest: 0.1,    
            roughness: 0.2
          });
        } 
        else if (nombreOriginal === "LOMO") {
          child.material = new THREE.MeshStandardMaterial({ 
            name: nombreOriginal, 
            map: textureLomo || null, 
            color: textureLomo ? "#ffffff" : "#1a1a1a",
            roughness: 0.4
          });
        }
        else if (nombreOriginal === "CONTRAPORTADA") {
          child.material = new THREE.MeshStandardMaterial({ 
            name: nombreOriginal, 
            map: textureContra || null, 
            color: textureContra ? "#ffffff" : "#1a1a1a", 
            roughness: 0.4
          });
        }
        else {
          const plastico = ESTILOS_GENERAL[consolaFinal] || { color: "#1a1a1a", roughness: 0.7, opacity: 1 };
          
          child.material = new THREE.MeshStandardMaterial({ 
            name: nombreOriginal, 
            color: plastico.color, 
            roughness: plastico.roughness ?? 0.7,
            metalness: 0.2,
            transparent: plastico.opacity !== undefined && plastico.opacity < 1,
            opacity: plastico.opacity ?? 1
          });
        }
      }
    });
  }, [clonedScene, texture, textureTemplate, consolaFinal]);

  const consolasCuadradas = ["n64","nds", "3ds", "ps1", "gameboy", "gameboycolor", "gameboyadvance"]; 
  const escalaModelo: [number, number, number] = consolasCuadradas.includes(consolaFinal) 
    ? [0.32, 0.25, 0.25]
    : [0.25, 0.25, 0.25];

  useFrame((state) => {
    if (!meshRef.current) return;
    let targetX = 0.05; 
    let targetY = -0.3;  
    
    let targetScale = isFocused ? 1.3 : 1; 
    let offsetY = 0;

    if (isLogging) {
      targetY = Math.PI; 
      targetX = 0; 
      targetScale = 3.5; 
      offsetY = -4; 
    } 
    else if (hovered) {
      targetY = state.pointer.x * 0.6; 
      targetX = 0.05 + (-state.pointer.y * 0.4);
      targetScale = isFocused ? 1.3 : 1.15;
    }

    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetY, 0.04);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetX, 0.04);
    const currentScale = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.04);
    meshRef.current.scale.set(currentScale, currentScale, currentScale);
    const targetPosY = (isFocused ? scrollY.current : 0) + offsetY;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetPosY, 0.04);
  });

  const handleGuardarEnBBDD = async () => {
    if (!userId || !juego) {
      alert("Error: Faltan datos del usuario o del juego.");
      return;
    }

    try {
      const { error: errorGame } = await supabase
        .from('games')
        .upsert({
          id: juego.id,
          title: juego.titulo,
          cover_image_url: juego.portada || null,
          platforms: juego.todasLasConsolas || null
        }, { onConflict: 'id' });

      if (errorGame) {
        console.error("Error insertando en 'games':", errorGame);
        throw errorGame;
      }

      const { error: errorUserGame } = await supabase
        .from('user_games')
        .upsert({
          user_id: userId,
          game_id: juego.id,
          status: status,
          difficulty: difficulty === 0 ? null : difficulty,
          rating: rating,
          time_played: timePlayed === 0 ? null : timePlayed,
          isFavorite: isFavorite, 
          start_date: startDate || null,
          finish_date: endDate || null,
          review: review,
          platform: consolaFinal
        });

      if (errorUserGame) throw errorUserGame;

      console.log("¡Registro guardado correctamente!");
      if (onSaveSuccess) onSaveSuccess("saved");

    } catch (error) {
      console.error("¡Peto algo conectando con Supabase!", error);
      alert("Hubo un error al guardar en la BBDD.");
    }
  };

  const handleBorrarDeBBDD = async () => {
    if (!userId || !juego || !isExisting) return;

    try {
      const { error } = await supabase
        .from('user_games')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', juego.id);

      if (error) throw error;

      console.log("¡Juego borrado correctamente!");
      if (onSaveSuccess) onSaveSuccess("deleted");

    } catch (error) {
      console.error("¡Peto algo al borrar en Supabase!", error);
      alert("Hubo un error al borrar en la BBDD.");
    }
  };

  return (
    <group ref={meshRef}>
      <Center>
        <primitive object={clonedScene} scale={escalaModelo} rotation={[0, 0, 0]} />
      </Center>

      {isLogging && (
        <Html
          transform
          position={[0.0, 0.65, -0.30]} 
          rotation={[0, Math.PI, 0]}
          scale={0.23}
        >
          <div 
            className="window"
            style={{ 
              width: "540px",
              padding: "6px", 
              background: "#ece9d8",
              boxShadow: "0px 10px 30px rgba(0,0,0,0.8)" 
            }}
          >
            <div className="title-bar" style={{ marginBottom: "10px" }}>
              <div className="title-bar-text">Registro de Partida - BBDD</div>
            </div>
            
            <div className="window-body" style={{ margin: "10px" }}>
              
              <fieldset style={{ marginBottom: "15px" }}>
                <legend>Estado</legend>
                <div className="field-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                  <input id="status-completed" type="radio" name="status" checked={status === "completed"} onChange={() => setStatus("completed")} />
                  <label htmlFor="status-completed" style={{ cursor: "pointer", paddingRight: "5px" }}>Completed</label>
                  
                  <input id="status-playing" type="radio" name="status" checked={status === "playing"} onChange={() => setStatus("playing")} />
                  <label htmlFor="status-playing" style={{ cursor: "pointer", paddingRight: "5px" }}>Playing</label>
                  
                  <input id="status-paused" type="radio" name="status" checked={status === "paused"} onChange={() => setStatus("paused")} />
                  <label htmlFor="status-paused" style={{ cursor: "pointer", paddingRight: "5px" }}>Paused</label>
                  
                  <input id="status-dropped" type="radio" name="status" checked={status === "dropped"} onChange={() => setStatus("dropped")} />
                  <label htmlFor="status-dropped" style={{ cursor: "pointer", paddingRight: "5px" }}>Dropped</label>
                  
                  <input id="status-wishlist" type="radio" name="status" checked={status === "wishlist"} onChange={() => setStatus("wishlist")} />
                  <label htmlFor="status-wishlist" style={{ cursor: "pointer" }}>Wishlist</label>
                </div>
              </fieldset>

              <fieldset style={{ marginBottom: "15px" }}>
                <legend>Estadísticas</legend>
                <div className="field-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <label>Dificultad:</label>
                    <input type="number" min="0" max="10" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} style={{ width: "40px" }} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <label style={{ marginRight: "5px" }}>Nota:</label>
                    <div style={{ display: "flex" }}>
                      {[1, 2, 3, 4, 5].map((starIndex) => {
                        const valorMitad = starIndex - 0.5;
                        const valorEntero = starIndex;

                        return (
                          <div key={starIndex} style={{ position: "relative", display: "inline-block", fontSize: "24px", lineHeight: "1" }}>
                            
                            <div
                              onClick={() => setRating(valorMitad)}
                              onMouseEnter={() => setHoverRating(valorMitad)}
                              onMouseLeave={() => setHoverRating(0)}
                              style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%", cursor: "pointer", zIndex: 10 }}
                            />
                            
                            <div
                              onClick={() => setRating(valorEntero)}
                              onMouseEnter={() => setHoverRating(valorEntero)}
                              onMouseLeave={() => setHoverRating(0)}
                              style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "100%", cursor: "pointer", zIndex: 10 }}
                            />

                            <span style={{ color: "#9ca3af", pointerEvents: "none" }}>★</span>

                            <span style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              color: "#fbbf24",
                              textShadow: "0 0 5px rgba(251, 191, 36, 0.6)",
                              overflow: "hidden",
                              width: (hoverRating || rating) >= valorEntero ? "100%" : (hoverRating || rating) >= valorMitad ? "50%" : "0%",
                              pointerEvents: "none", 
                              transition: "width 0.1s"
                            }}>
                              ★
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <label>Horas:</label>
                    <input type="number" min="0" value={timePlayed} onChange={(e) => setTimePlayed(Number(e.target.value))} style={{ width: "50px" }} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button 
                      type="button"
                      onClick={() => setIsFavorite(!isFavorite)}
                      style={{ 
                        background: "transparent", border: "none", boxShadow: "none", minWidth: "auto",
                        fontSize: "28px", lineHeight: "1", cursor: "pointer", padding: "0 5px",
                        color: isFavorite ? "#dc2626" : "#9ca3af",
                        transform: isFavorite ? "scale(1.15)" : "scale(1)",
                        transition: "all 0.2s ease"
                      }}
                      title="Marcar como favorito"
                    >
                      ♥
                    </button>
                  </div>

                </div>
              </fieldset>

              <fieldset style={{ marginBottom: "15px" }}>
                <legend>Fechas</legend>
                <div className="field-row" style={{ display: "flex", justifyContent: "space-around" }}>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{color: "#333" }}>Inicio:</label>
                    <input 
                      type="date" 
                      value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      style={{ 
                        fontFamily: "inherit",
                        padding: "4px 8px",
                        border: "1px solid #8e8f8f",
                        borderRadius: "3px",
                        backgroundColor: "white",
                        boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.1)",
                        cursor: "pointer"
                      }} 
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{color: "#333" }}>Fin:</label>
                    <input 
                      type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                      style={{ 
                        fontFamily: "inherit",
                        padding: "4px 8px",
                        border: "1px solid #8e8f8f",
                        borderRadius: "3px",
                        backgroundColor: "white",
                        boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.1)",
                        cursor: "pointer"
                      }} 
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset style={{ marginBottom: "15px" }}>
                <legend>Review</legend>
                <div className="field-row" style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "15px" }}>
                  <textarea 
                    rows={4} 
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Escribe aquí tu opinión sobre el juego..."
                    style={{ width: "100%", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                  ></textarea>
                </div>
              </fieldset>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px", marginTop: "10px" }}>
                <button 
                  onClick={handleBorrarDeBBDD} 
                  disabled={!isExisting}
                  style={{ 
                    fontWeight: "bold", 
                    padding: "6px 20px", 
                    cursor: !isExisting ? "default" : "pointer",
                    color: !isExisting ? "#888" : "#d9534f"
                  }}
                >
                  Borrar
                </button>
                <button onClick={handleGuardarEnBBDD} style={{ fontWeight: "bold", padding: "6px 20px", cursor: "pointer" }}>
                  Loguear
                </button>
              </div>

            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function GameCard3D({ coverUrl, onClick, consola, isFocused = false, isLogging = false, juego, userId, onSaveSuccess, onPlatformFetched }: { coverUrl?: string, onClick?: () => void, consola: string | null, isFocused?: boolean, isLogging?: boolean, juego?: any, userId?: string | null, onSaveSuccess?: (action: "saved" | "deleted") => void, onPlatformFetched?: (platform: string) => void }) {
  const [hovered, setHovered] = useState(false);

  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { rootMargin: "200px" });

    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [isFocused]);

  const escena3D = (
    <>
      <ambientLight intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={2} />
      <Environment preset="city" />

      <Float speed={2} rotationIntensity={0} floatIntensity={hovered ? 0.4 : 0.1}>
        <Suspense fallback={null}>
          <Model 
            url="/models/carcasa.glb?v=10" 
            coverUrl={coverUrl} 
            hovered={hovered} 
            consola={consola}
            isFocused={isFocused}
            isLogging={isLogging}
            juego={juego}
            userId={userId}
            onSaveSuccess={onSaveSuccess}
            onPlatformFetched={onPlatformFetched}
        />
        </Suspense>
      </Float>
      
      {!isFocused && (
        <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={10} blur={2.5} />
      )}
    </>
  );

  if (isFocused) {
    return (
      <div style={{ width: "100%", height: "100%", position: "relative", zIndex: 200 }}>
        <Canvas camera={{ position: [0, 0, 22], fov: 20 }}>
          {escena3D}
        </Canvas>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: "100%", height: "100%", position: "relative",
        cursor: hovered ? "pointer" : "default", zIndex: hovered ? 50 : 1 
      }} 
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      {isVisible ? (
        <View style={{ position: "absolute", top: "-25%", left: "-25%", width: "150%", height: "150%" }}>
          {escena3D}
        </View>
      ) : (
        <div style={{ width: "100%", height: "100%", backgroundColor: "#e5e7eb", backgroundImage: coverUrl ? `url(${coverUrl})` : "none", backgroundSize: "cover", backgroundPosition: "center", border: "2px inset #fff", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
          {!coverUrl && <span style={{ fontSize: "1.5rem" }}>🖼️</span>}
        </div>
      )}
    </div>
  );
}