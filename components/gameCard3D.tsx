"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float, ContactShadows, Environment, useTexture, Center, View, Html } from "@react-three/drei";
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

function Model({ url, coverUrl, hovered, consola, isFocused, isLogging}: { url: string, coverUrl: string, hovered: boolean, consola: string | null, isFocused?: boolean, isLogging?: boolean   }) {
  const { scene } = useGLTF(url);
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  const meshRef = useRef<THREE.Group>(null);
  
  const consolaFinal = consola ? consola : "pc";
  const templatePath = `/models/${consolaFinal}/${consolaFinal}_1.png`;
  const lomoPath = `/models/${consolaFinal}/${consolaFinal}_2.png`;
  const contraPath = `/models/${consolaFinal}/${consolaFinal}_3.png`;

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [textureTemplate, setTextureTemplate] = useState<THREE.Texture | null>(null);
  const [textureLomo, setTextureLomo] = useState<THREE.Texture | null>(null);
  const [textureContra, setTextureContra] = useState<THREE.Texture | null>(null);

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

    loader.load(
      lomoPath, 
      (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; setTextureLomo(tex); },
      undefined,
      (err) => console.warn("--> Lomo no encontrado:", lomoPath)
    );

    loader.load(
      contraPath, 
      (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; setTextureContra(tex); },
      undefined,
      (err) => console.warn("--> Contraportada no encontrada:", contraPath)
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
    
    let targetScale = 1;

    if (isLogging) {
      targetY = Math.PI; 
      targetX = 0; 
      targetScale = 1;
    } else if (hovered) {
      targetY = state.pointer.x * 0.6; 
      targetX = 0.05 + (-state.pointer.y * 0.4);
      targetScale = isFocused ? 1 : 1.15;
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

      {isLogging && (
        <Html
          transform
          position={[0, 0, -0.25]}
          rotation={[0, Math.PI, 0]}
          scale={0.25}
        >
          <div 
            className="window"
            style={{ 
              width: "280px", 
              padding: "15px", 
              background: "#ece9d8",
              boxShadow: "0px 10px 30px rgba(0,0,0,0.8)" 
            }}
          >
            <div className="title-bar" style={{ marginBottom: "10px" }}>
              <div className="title-bar-text">Añadir a mi colección</div>
            </div>
            
            <div className="window-body">
              <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "black" }}>
                ¿Qué te ha parecido <b>{consolaFinal.toUpperCase()}</b>?
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input 
                  type="text" 
                  placeholder="Tu opinión o nota aquí..." 
                  style={{ width: "100%", padding: "5px", boxSizing: "border-box" }}
                />
                <button style={{ cursor: "pointer", fontWeight: "bold" }}>
                  Guardar en Base de Datos
                </button>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function GameCard3D({ coverUrl, onClick, consola, isFocused = false, isLogging = false }: { coverUrl: string, onClick?: () => void, consola: string | null, isFocused?: boolean, isLogging?: boolean }) {
  const [hovered, setHovered] = useState(false);

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
          />
        </Suspense>
      </Float>
      <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={10} blur={2.5} />
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
      style={{ 
        width: "100%", height: "100%", position: "relative",
        cursor: hovered ? "pointer" : "default", zIndex: hovered ? 50 : 1 
      }} 
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      <View style={{ position: "absolute", top: "-25%", left: "-25%", width: "150%", height: "150%" }}>
        {escena3D}
      </View>
    </div>
  );
}