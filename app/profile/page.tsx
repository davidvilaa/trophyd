"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  const [userProfile, setUserProfile] = useState({ nickname: "", bio: "", pfp: "" });
  const [notaMedia, setNotaMedia] = useState(0);
  const [distribucionNotas, setDistribucionNotas] = useState<Record<number, number>>({
    0.5: 0, 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0
  });
  const [maxNotaCount, setMaxNotaCount] = useState(1);
  const [favoritos, setFavoritos] = useState<any[]>([]);

  useEffect(() => {
    const cargarPerfilYDatos = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }

        const userId = session.user.id;

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("nickname, bio, pfp_url")
          .eq("id", userId)
          .single();

        if (!profileError && profileData) {
          setUserProfile({
            nickname: profileData.nickname || "Usuario",
            bio: profileData.bio || "Este usuario aún no ha escrito una biografía.",
            pfp: profileData.pfp_url || "https://www.gravatar.com/avatar/0?d=mp&f=y"
          });
        }

        const { data: ratingsData } = await supabase
          .from("user_games")
          .select("rating")
          .eq("user_id", userId)
          .not("rating", "is", null);

        if (ratingsData && ratingsData.length > 0) {
          let suma = 0;
          let counts: Record<number, number> = { 0.5: 0, 1: 0, 1.5: 0, 2: 0, 2.5: 0, 3: 0, 3.5: 0, 4: 0, 4.5: 0, 5: 0 };

          ratingsData.forEach((row) => {
            const nota = Number(row.rating);
            suma += nota;
            
            const bucket = Math.round(nota * 2) / 2;
            if (counts[bucket] !== undefined) {
              counts[bucket] += 1;
            }
          });

          setNotaMedia(Number((suma / ratingsData.length).toFixed(1)));
          setDistribucionNotas(counts);
          setMaxNotaCount(Math.max(...Object.values(counts), 1));
        }

        const { data: favsData } = await supabase
          .from("user_games")
          .select(`
            game_id,
            games (
              title,
              cover_image_url
            )
          `)
          .eq("user_id", userId)
          .eq("isFavorite", true)
          .limit(5);

        if (favsData) {
          setFavoritos(favsData);
        }

      } catch (error) {
        console.error("Error cargando el perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfilYDatos();
  }, [router]);

  const favoritosMostrados = Array(5).fill(null).map((_, index) => favoritos[index] || null);

  if (loading) {
    return <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">Cargando perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-black pt-10 pb-20 px-4">
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        <div style={{ display: "flex", gap: "30px", marginBottom: "40px", alignItems: "center" }}>
          <div style={{ 
            width: "150px", height: "150px", flexShrink: 0,
            border: "3px inset #fff", backgroundColor: "#ccc",
            backgroundImage: `url(${userProfile.pfp})`, backgroundSize: "cover", backgroundPosition: "center"
          }}></div>
          
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "36px", fontWeight: "bold", color: "#111" }}>
              {userProfile.nickname}
            </h1>
            <p style={{ margin: 0, color: "#444", lineHeight: "1.6", fontSize: "16px", maxWidth: "800px", whiteSpace: "pre-wrap" }}>
              {userProfile.bio}
            </p>
          </div>
        </div>

        <style>{`
          .tab-activa {
            background-color: rgba(51, 153, 255, 0.2);
            box-shadow: inset 0 0 5px rgba(0,0,0,0.05);
          }
          .fav-card:hover { transform: scale(1.05); transition: transform 0.2s ease; cursor: pointer; }
        `}</style>

        <ul role="menubar" style={{ marginBottom: "30px", fontSize: "16px" }}>
          <li role="menuitem" tabIndex={0} onClick={() => setActiveTab("profile")} className={activeTab === "profile" ? "tab-activa" : ""}>
            Profile
          </li>
          <li role="menuitem" tabIndex={0} onClick={() => setActiveTab("games")} className={activeTab === "games" ? "tab-activa" : ""}>
            Games
          </li>
          <li role="menuitem" tabIndex={0} onClick={() => setActiveTab("guides")} className={activeTab === "guides" ? "tab-activa" : ""}>
            Guides
          </li>
          <li role="menuitem" tabIndex={0} onClick={() => setActiveTab("network")} className={activeTab === "network" ? "tab-activa" : ""}>
            Network
          </li>
        </ul>

        <div style={{ minHeight: "500px" }}>
          {activeTab === "profile" && (
            <div style={{ display: "flex", gap: "30px", alignItems: "stretch" }}>
              
              <fieldset style={{ width: "260px", padding: "20px", display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
                <legend style={{ fontSize: "18px" }}>Ratings</legend>
                
                <p style={{ margin: "0 0 25px 0", fontWeight: "bold", textAlign: "center", fontSize: "18px" }}>
                  Nota media: {notaMedia > 0 ? notaMedia : "--"}
                </p>
                
                <div style={{ 
                  display: "flex", alignItems: "flex-end", justifyContent: "space-between", 
                  height: "120px", marginTop: "auto", borderBottom: "2px solid #888", paddingBottom: "2px", gap: "2px"
                }}>
                  {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((estrella) => {
                    const heightPercent = maxNotaCount > 0 ? (distribucionNotas[estrella] / maxNotaCount) * 100 : 0;
                    
                    return (
                      <div 
                        key={estrella}
                        style={{ 
                          flex: 1, 
                          height: `${Math.max(heightPercent, 2)}%`,
                          backgroundColor: "#16a34a",
                          transition: "height 0.5s ease-out"
                        }} 
                        title={`${estrella} Estrellas: ${distribucionNotas[estrella]} juegos`}
                      ></div>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset style={{ flex: 1, padding: "20px", backgroundColor: "#fff" }}>
                <legend style={{ fontSize: "18px" }}>Favorite Games</legend>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px" }}>
                  {favoritosMostrados.map((fav, index) => (
                    <div key={index} className={fav ? "fav-card" : ""} style={{ 
                      aspectRatio: "3/4", backgroundColor: "#e5e7eb", border: "2px inset #fff",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "2rem",
                      backgroundImage: fav ? `url(${fav.games.cover_image_url})` : "none",
                      backgroundSize: "cover", backgroundPosition: "center"
                    }}>
                      {!fav && "🖼️"}
                    </div>
                  ))}
                </div>
              </fieldset>

            </div>
          )}

          {activeTab === "games" && <h2 style={{ fontSize: "24px" }}>Tu colección de juegos aparecerá aquí...</h2>}
          {activeTab === "guides" && <h2 style={{ fontSize: "24px" }}>Tus guías publicadas aparecerán aquí...</h2>}
          {activeTab === "network" && <h2 style={{ fontSize: "24px" }}>Red social y amigos...</h2>}
          
        </div>

      </div>
    </div>
  );
}