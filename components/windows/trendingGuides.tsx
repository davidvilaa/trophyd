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
      {index >= 3 && (
        <div style={{
          position: "absolute",
          top: "-10px",
          left: "-10px",
          width: "28px",
          height: "28px",
          backgroundColor: "#334155",
          color: "#fff",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "14px",
          zIndex: 30,
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          border: "2px solid #fff"
        }}>
          {index + 1}
        </div>
      )}

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
          <Canvas camera={{ position: [0, 0, 15], fov: 40 }}>
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
}

export default function TrendingWindow() {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

          const sorted = processed.sort((a, b) => b.likesCount - a.likesCount);
          setTrending(sorted.slice(0, 10)); 
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <Draggable handle=".title-bar" nodeRef={windowRef} defaultPosition={{ x: 550, y: 100 }}>
      <div 
        ref={windowRef} 
        className="window glass active" 
        style={{ width: "600px", position: "absolute", zIndex: 10 }}
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
          
          <div style={{ 
            padding: "15px", 
            borderBottom: "1px solid #ccc", 
            backgroundColor: "#fff",
            backgroundImage: "linear-gradient(to bottom, #fff 0%, #f9fafb 100%)"
          }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#111", display: "flex", alignItems: "center", gap: "8px" }}>
              <Flame size={20} color="#dc2626" /> 
              Las guías más votadas
            </h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
              Descubre qué están usando otros jugadores para pasarse sus juegos.
            </p>
          </div>
          
          <div style={{ padding: "15px", maxHeight: "450px", overflowY: "auto", overflowX: "hidden" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>Buscando las mejores guías... ⏳</div>
            ) : trending.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "12px" }}>
                Aún no hay guías suficientes.
              </div>
            ) : (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", 
                gap: "20px",
                padding: "5px"
              }}>
                {trending.map((guia, index) => (
                  <TrendingItem key={guia.id} guia={guia} index={index} router={router} />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="status-bar" style={{ margin: 0 }}>
          <p className="status-bar-field">Mostrando el Top 10 Global</p>
        </div>
      </div>
    </Draggable>
  );
}