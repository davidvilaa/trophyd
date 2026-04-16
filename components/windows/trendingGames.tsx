"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Draggable from "react-draggable";
import { supabase } from "@/lib/supabase";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Float } from "@react-three/drei";
import * as THREE from "three";
import GameCaseCard from "@/components/cards/gameCard"; 

function Medalla3D({ url, rank }: { url: string, rank: number }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(), [scene]);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const color = rank === 0 ? "#FFD700" : rank === 1 ? "#C0C0C0" : "#CD7F32";
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(color);
        child.material.metalness = 0.8;
        child.material.roughness = 0.2;
      }
    });
  }, [clone, rank]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <group ref={meshRef} position={[1.5, -3, 0]}>
      <primitive object={clone} scale={0.06} position={[0, 0, 0]} />
    </group>
  );
}

function TrendingGameItem({ game, index, router }: { game: any, index: number, router: any }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <GameCaseCard 
        gameData={game} 
        onClick={() => router.push(`/game/${game.id}`)}
      />

      {index < 3 && (
        <div style={{
          position: "absolute",
          bottom: "-25px",
          right: "-25px",
          width: "90px",
          height: "90px",
          zIndex: 40,
          pointerEvents: "none",
          opacity: hovered ? 0.2 : 1,
          transition: "opacity 0.3s ease"
        }}>
          <Canvas camera={{ position: [550, 0, 15], fov: 40 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 5, 5]} intensity={2} />
            <Environment preset="city" />
            <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
              <Medalla3D url="/models/medalla.glb" rank={index} />
            </Float>
          </Canvas>
        </div>
      )}
    </div>
  );
} // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! - CAMARA MOVIDA POR EL MOMENTO, CAMBIAR LUEGO ^^^^^^ 

export default function TrendingGamesWindow() {
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mensual");
  
  const windowRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_games")
          .select(`
            game_id,
            created_at,
            games ( id, title, cover_image_url )
          `);

        if (error) throw error;
        if (data) setAllEntries(data);
      } catch (error) {
        console.error("Error obteniendo juegos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGameData();
  }, []);

  useEffect(() => {
    if (allEntries.length === 0) return;

    const now = new Date();
    const timeLimit = new Date();
    if (activeTab === "diario") timeLimit.setDate(now.getDate() - 1);
    else if (activeTab === "semanal") timeLimit.setDate(now.getDate() - 7);
    else if (activeTab === "mensual") timeLimit.setMonth(now.getMonth() - 1);

    const filtered = allEntries.filter(entry => new Date(entry.created_at) >= timeLimit);

    const counts: Record<string, { count: number, gameData: any }> = {};
    filtered.forEach(entry => {
      if (!entry.games) return;
      const id = entry.game_id;
      if (!counts[id]) {
        counts[id] = { count: 0, gameData: entry.games };
      }
      counts[id].count++;
    });

    const sorted = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        id: item.gameData.id,
        games: item.gameData, 
        title: item.gameData.title,
        cover_url: item.gameData.cover_image_url, 
        popularity: item.count
      }));

    setTrending(sorted);
  }, [allEntries, activeTab]);

  return (
    <Draggable handle=".title-bar" nodeRef={windowRef} defaultPosition={{ x: 0, y: 0 }}>
      <div 
        ref={windowRef} 
        className="window glass active" 
        style={{ width: "600px", position: "absolute", left: "calc(48.5vw - 300px)", top: "420px", zIndex: 11 }}
      >
        <div className="title-bar" style={{ cursor: "grab" }}>
          <div className="title-bar-text" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Trophy size={14} color="#ffd700" /> 
            Juegos en Tendencia
          </div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>

        <div className="window-body has-space" style={{ margin: 0, padding: 0, backgroundColor: "#f3f4f6" }}>
          
          <ul role="menubar" style={{ margin: 0, padding: "2px 2px", fontSize: "14px", borderBottom: "1px solid rgba(0,0,0,0.1)", display: "flex", listStyle: "none" }}>
            {["diario", "semanal", "mensual"].map((tab) => (
              <li 
                key={tab}
                role="menuitem" 
                className={activeTab === tab ? "tab-activa-games" : ""}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  cursor: "pointer", 
                  padding: "4px 12px", 
                  textTransform: "capitalize",
                  background: activeTab === tab ? "linear-gradient(to bottom, rgba(175, 205, 245, 0.4) 0%, rgba(135, 175, 225, 0.4) 100%)" : "transparent",
                  borderRadius: "3px"
                }}
              >
                Top {tab}
              </li>
            ))}
          </ul>
          
          <div style={{ padding: "0" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>Cargando...</div>
            ) : trending.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "12px" }}>
                No hay actividad reciente para mostrar.
              </div>
            ) : (
              <div style={{ 
                display: "flex", 
                flexDirection: "row",
                overflowX: "auto",
                overflowY: "hidden",
                gap: "20px",
                padding: "20px 20px 45px 20px"
              }}>
                {trending.map((juego, index) => (
                  <div key={juego.id} style={{ flex: "0 0 160px" }}>
                    <TrendingGameItem game={juego} index={index} router={router} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
}