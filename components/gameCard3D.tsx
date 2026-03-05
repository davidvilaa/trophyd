"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float, ContactShadows, Environment, useTexture, Center } from "@react-three/drei";
import * as THREE from "three";

function Model({ url, coverUrl, onClick }: { url: string, coverUrl: string, onClick: () => void }) {
  const { scene } = useGLTF(url);
  
  // 💥 CLONAMOS LA ESCENA para que cada carcasa sea única e independiente
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  
  const meshRef = useRef<THREE.Group>(null);
  const texture = useTexture(coverUrl);
  texture.flipY = false;

  // Usamos clonedScene en lugar de scene para todo
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({ 
          map: texture, 
          roughness: 0.4 
        });
      }
    });
  }, [clonedScene, texture]);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, state.mouse.x * 0.5, 0.1);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -state.mouse.y * 0.5, 0.1);
  });

  return (
  <group ref={meshRef}>
    <primitive 
      object={clonedScene} 
      scale={6.5}
      onClick={onClick} 
    />
  </group>
);
}

export default function GameCard3D({ coverUrl, onClick }: { coverUrl: string, onClick: () => void }) {
  return (
    <div style={{ width: "100%", height: "100%", cursor: "pointer" }} onClick={onClick}>
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }}>
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <Environment preset="city" />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Center top> 
            <Model url="/models/carcasaPLACEHOLDER.glb" coverUrl={coverUrl} onClick={onClick} />
          </Center>
        </Float>

        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} />
      </Canvas>
    </div>
  );
}