"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Draggable from "react-draggable";
import { supabase } from "@/lib/supabase";
import { Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import GuideCaseCard from "@/components/cards/guideCard";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

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

function TrendingItem({ guia, index, router }: { guia: any, index: number, router: any }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <GuideCaseCard 
        guideData={guia} 
        subtitle={`${guia.games?.title} • Por: ${guia.profiles?.nickname}`}
        onClick={() => router.push(`/game/${guia.game_id}/guide/${guia.id}`)}
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

export default function TrendingWindow() {
  const [allGuides, setAllGuides] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mensual");
  
  const windowRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("guides")
          .select(`
            id, 
            title, 
            average_time, 
            average_difficulty,
            cover_url, 
            user_id,
            game_id,
            created_at,
            games ( id, title, cover_image_url ),
            profiles!guides_user_id_fkey (nickname),
            guide_likes (user_id)
          `);

        if (error) throw error;

        if (data) {
          const processed = data.map((g: any) => ({
            ...g,
            likesCount: g.guide_likes ? g.guide_likes.length : 0
          }));
          setAllGuides(processed);
        }
      } catch (error) {
        console.error("Error obteniendo trending:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  useEffect(() => {
    if (allGuides.length === 0) return;

    const now = new Date();
    const timeLimit = new Date();

    if (activeTab === "diario") {
      timeLimit.setDate(now.getDate() - 1);
    } else if (activeTab === "semanal") {
      timeLimit.setDate(now.getDate() - 7);
    } else if (activeTab === "mensual") {
      timeLimit.setMonth(now.getMonth() - 1);
    }

    const filtered = allGuides.filter(g => new Date(g.created_at) >= timeLimit);
    const sorted = filtered.sort((a, b) => b.likesCount - a.likesCount);

    setTrending(sorted.slice(0, 10));
  }, [allGuides, activeTab]);

  return (
    <Draggable handle=".title-bar" nodeRef={windowRef} defaultPosition={{ x: 0, y: 0 }}>
      <div 
        ref={windowRef} 
        className="window glass active" 
        style={{ width: "600px", position: "absolute", left: "calc(48.5vw - 300px)", top: "50px", zIndex: 10 }}
      >
        <div className="title-bar" style={{ cursor: "grab" }}>
          <div className="title-bar-text" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Flame size={14} color="#ff7b00" style={{ filter: "drop-shadow(0 0 2px rgba(255,123,0,0.8))" }} /> 
            Top Guías de la Comunidad
          </div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>

        <div className="window-body has-space" style={{ margin: 0, padding: 0, backgroundColor: "#f3f4f6" }}>
          
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
          `}</style>

          <ul role="menubar" style={{ margin: 0, padding: "2px 2px", fontSize: "14px", backgroundColor: "transparent", borderBottom: "1px solid rgba(0,0,0,0.1)", display: "flex" }}>
            <li 
              role="menuitem" 
              tabIndex={0} 
              className={activeTab === "diario" ? "tab-activa" : ""}
              onClick={() => setActiveTab("diario")}
              style={{ cursor: "pointer", padding: "4px 10px" }}
            >
              Top Diario
            </li>
            <li 
              role="menuitem" 
              tabIndex={0} 
              className={activeTab === "semanal" ? "tab-activa" : ""}
              onClick={() => setActiveTab("semanal")}
              style={{ cursor: "pointer", padding: "4px 10px" }}
            >
              Top Semanal
            </li>
            <li 
              role="menuitem" 
              tabIndex={0} 
              className={activeTab === "mensual" ? "tab-activa" : ""}
              onClick={() => setActiveTab("mensual")}
              style={{ cursor: "pointer", padding: "4px 10px" }}
            >
              Top Mensual
            </li>
          </ul>
          
          <div style={{ padding: "0" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>Cargando...</div>
            ) : trending.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "12px" }}>
                Aún no hay guías destacadas para este periodo.
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
                {trending.map((guia, index) => (
                  <div key={guia.id} style={{ flex: "0 0 160px" }}>
                    <TrendingItem guia={guia} index={index} router={router} />
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