"use client";

import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float, ContactShadows, Environment, useTexture, Center } from "@react-three/drei";
import * as THREE from "three";

function Model({ url, coverUrl, onClick, hovered }: { url: string, coverUrl: string, onClick: () => void, hovered: boolean }) {
  const { scene } = useGLTF(url);
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  const meshRef = useRef<THREE.Group>(null);

  const texture = useTexture(coverUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  
  texture.flipY = true; 

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({ 
          color: "#2a2a2a", 
          roughness: 0.6,
          metalness: 0.1
        });
      }
    });
  }, [clonedScene]);

  useFrame((state) => {
    if (!meshRef.current) return;
    let targetX = 0;
    let targetY = 0;

    if (hovered) {
      targetY = state.mouse.x * 0.5;
      targetX = -state.mouse.y * 0.5;
    } 

    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetY, 0.1);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetX, 0.1);
  });

  return (
    <group ref={meshRef} onClick={onClick}>
      
      <Center>
        <primitive 
          object={clonedScene} 
          scale={6.5} 
          rotation={[0, Math.PI, 0]}
        />
      </Center>

      <mesh position={[0, 0, 0.5]} scale={[2.8, 3.9, 1]}> 
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial map={texture} roughness={0.3} />
      </mesh>

    </group>
  );
}

export default function GameCard3D({ coverUrl, onClick }: { coverUrl: string, onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      style={{ width: "100%", height: "100%", cursor: hovered ? "pointer" : "default" }} 
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Canvas camera={{ position: [0, 0, 12], fov: 30 }}>
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <Environment preset="city" />

        <Float speed={2} rotationIntensity={hovered ? 0.3 : 0.1} floatIntensity={hovered ? 0.8 : 0.3}>
          <Suspense fallback={null}>
            <Model 
              url="/models/carcasaPLACEHOLDER.glb" 
              coverUrl={coverUrl} 
              onClick={onClick} 
              hovered={hovered} 
            />
          </Suspense>
        </Float>

        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2} />
      </Canvas>
    </div>
  );
}