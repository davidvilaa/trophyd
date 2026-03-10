"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Float, ContactShadows, Environment, useTexture, Center, View } from "@react-three/drei";
import * as THREE from "three";

const AJUSTES_PORTADA: Record<string, { repeat: [number, number], offset: [number, number] }> = {
  "ps1": { repeat: [1.17, 1], offset: [-0.17, 0] },
  "ps2": {repeat: [1,1.07], offset: [0,-0.09]},
  "ps3": {repeat: [1,1], offset: [0,-0.08]},
  "ps4": {repeat: [1,1.1], offset: [0,-0.12]},
  "ps5": {repeat: [1,1.08], offset: [0,-0.11]},
  "psp": {repeat: [1,1.08], offset: [0,-0.1]},
  "psvita": {repeat: [1,1.06], offset: [0,-0.08]},
  "nes": {repeat: [1,1], offset: [0,0]}, // !!
  "snes": {repeat: [1,1.65], offset: [0,-0.36]},
  "n64": {repeat: [1,1], offset: [0,0]}, // !!
  "gamecube": {repeat: [1,0.97], offset: [0,-0.05]},
  "wii": {repeat: [1,0.98], offset: [0,0]},
  "wiiu": {repeat: [1,0.97], offset: [0,-0.05]},
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

function Model({ url, coverUrl, hovered, consola }: { url: string, coverUrl: string, hovered: boolean, consola: string | null }) {
  const { scene } = useGLTF(url);
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  const meshRef = useRef<THREE.Group>(null);
  
  const consolaFinal = consola ? consola : "pc";
  const templatePath = `/models/${consolaFinal}/${consolaFinal}_1.png`;

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [textureTemplate, setTextureTemplate] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
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
  }, [coverUrl, templatePath]);

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
        else {
          child.material = new THREE.MeshStandardMaterial({ 
            name: nombreOriginal, color: "#1a1a1a", roughness: 0.7, metalness: 0.2
          });
        }
      }
    });
  }, [clonedScene, texture, textureTemplate, consolaFinal]);

  const consolasCuadradas = ["nds", "3ds", "ps1", "gameboy", "gameboycolor", "gameboyadvance"]; 
  const escalaModelo: [number, number, number] = consolasCuadradas.includes(consolaFinal) 
    ? [0.32, 0.25, 0.25]
    : [0.25, 0.25, 0.25];

  useFrame((state) => {
    if (!meshRef.current) return;
    let targetX = 0.05; 
    let targetY = -0.3;  
    let targetScale = 1;

    if (hovered) {
      targetY = state.pointer.x * 0.6; 
      targetX = 0.05 + (-state.pointer.y * 0.4);
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
        <primitive object={clonedScene} scale={escalaModelo} rotation={[0, 0, 0]} />
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
              url="/models/carcasa.glb?v=10" 
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