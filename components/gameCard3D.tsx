"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Float, ContactShadows, Environment, useTexture, Center, View } from "@react-three/drei";
import * as THREE from "three";

const FALLBACK_TRANSPARENTE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function Model({ url, coverUrl, hovered, consola }: { url: string, coverUrl: string, hovered: boolean, consola: string | null }) {
  const { scene } = useGLTF(url);
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  const meshRef = useRef<THREE.Group>(null);
  
  const texture = useTexture(coverUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; 

  const templatePath = consola ? `/models/${consola}/${consola}_1.png` : FALLBACK_TRANSPARENTE;
  const textureTemplate = useTexture(templatePath);
  textureTemplate.colorSpace = THREE.SRGBColorSpace;
  textureTemplate.flipY = false;

  texture.center.set(0.5, 0.5);
  texture.repeat.set(1, 0.85);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const nombreOriginal = child.material.name;
        
        if (nombreOriginal === "PORTADA") { 
          child.material = new THREE.MeshStandardMaterial({ 
            name: nombreOriginal, map: texture, roughness: 0.3,
          });
        } 
        else if (nombreOriginal === "T_PORTADA") {
          if (consola) {
            child.visible = true;
            child.material = new THREE.MeshStandardMaterial({ 
              name: nombreOriginal, 
              map: textureTemplate, 
              transparent: true,
              alphaTest: 0.1,
              roughness: 0.2
            });
          } else {
            child.visible = false; 
          }
        } 
        else {
          child.material = new THREE.MeshStandardMaterial({ 
            name: nombreOriginal, color: "#1a1a1a", roughness: 0.7, metalness: 0.2
          });
        }
      }
    });
  }, [clonedScene, texture, textureTemplate, consola]);

  useFrame((state) => {
    if (!meshRef.current) return;
    let targetX = 0.05; 
    let targetY = -0.3;  
    let targetScale = 1;

    if (hovered) {
      targetY = 0.3 + (state.mouse.x * 0.4);
      targetX = 0.05 + (-state.mouse.y * 0.4);
      targetScale = 1.15;
    } 

    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetY, 0.1);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetX, 0.1);
    const currentScale = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1);
    meshRef.current.scale.set(currentScale, currentScale, currentScale);
  });

  return (
    <group ref={meshRef}>
      <Center>
        <primitive object={clonedScene} scale={0.25} rotation={[0, 0, 0]} />
      </Center>
    </group>
  );
}

export default function GameCard3D({ coverUrl, onClick, consola}: { coverUrl: string, onClick: () => void, consola: string | null }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      style={{ 
        width: "100%", height: "100%", position: "relative",
        cursor: hovered ? "pointer" : "default", zIndex: hovered ? 50 : 1 
      }} 
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      <View style={{ position: "absolute", top: "-25%", left: "-25%", width: "150%", height: "150%" }}>
        <ambientLight intensity={1.2} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <Environment preset="city" />

        <Float speed={2} rotationIntensity={0} floatIntensity={hovered ? 0.4 : 0.1}>
          <Suspense fallback={null}>
            <Model 
              url="/models/carcasaPRUEBA.glb?v=10" 
              coverUrl={coverUrl} 
              hovered={hovered} 
              consola={consola}
            />
          </Suspense>
        </Float>
        <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={10} blur={2.5} />
      </View>
    </div>
  );
}