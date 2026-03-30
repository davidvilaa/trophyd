"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  
  const targetNickname = params.nickname as string;

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ id: "", nickname: "", bio: "", pfp: "" });
  const [perfilNoEncontrado, setPerfilNoEncontrado] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const cargarPerfil = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let loggedUserId = null;
        if (session) {
          loggedUserId = session.user.id;
          setCurrentUserId(loggedUserId);
        }

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("id, nickname, bio, pfp_url")
          .eq("nickname", targetNickname)
          .single();

        if (error || !profileData) {
          setPerfilNoEncontrado(true);
          return;
        }

        setUserProfile({
          id: profileData.id,
          nickname: profileData.nickname,
          bio: profileData.bio || "Este usuario aún no ha escrito una biografía.",
          pfp: profileData.pfp_url || "https://www.gravatar.com/avatar/0?d=mp&f=y"
        });

        if (loggedUserId && loggedUserId !== profileData.id) {
          const { data: followData } = await supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", loggedUserId)
            .eq("following_id", profileData.id)
            .maybeSingle();

          setIsFollowing(!!followData);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (targetNickname) {
      cargarPerfil();
    }
  }, [targetNickname]);

  const toggleFollow = async () => {
    if (!currentUserId || !userProfile.id || isToggling) return;
    
    setIsToggling(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userProfile.id);
          
        if (error) throw error;
        
        setIsFollowing(false);
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: userProfile.id });
          
        if (error) throw error;
        
        setIsFollowing(true);
      }
    } catch (error: any) {
      console.error("Error al hacer toggle follow:", error);
      alert("¡Supabase ha bloqueado el follow! Motivo: " + error.message);
    } finally {
      setIsToggling(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">Buscando usuario...</div>;
  }

  if (perfilNoEncontrado) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center gap-4">
        <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>Usuario no encontrado</h1>
        <p>El perfil "{targetNickname}" no existe en Trophyd.</p>
        <button onClick={() => router.push("/")} style={{ padding: "8px 16px" }}>Volver al inicio</button>
      </div>
    );
  }

  const baseUrl = `/profile/${targetNickname}`;

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
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px" }}>
              <h1 style={{ margin: 0, fontSize: "36px", fontWeight: "bold", color: "#111" }}>
                {userProfile.nickname}
              </h1>
              
              {currentUserId && currentUserId !== userProfile.id && (
                <button 
                  onClick={toggleFollow}
                  disabled={isToggling}
                  style={{ 
                    padding: "4px 16px", 
                    fontSize: "14px", 
                    fontWeight: "bold",
                    cursor: isToggling ? "wait" : "pointer",
                    backgroundColor: isFollowing ? "#e5e7eb" : "buttonface"
                  }}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
            
            <p style={{ margin: 0, color: "#444", lineHeight: "1.6", fontSize: "16px", maxWidth: "800px", whiteSpace: "pre-wrap" }}>
              {userProfile.bio}
            </p>
          </div>
        </div>

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

        <ul role="menubar" style={{ marginBottom: "30px", fontSize: "16px" }}>
          <li role="menuitem" className={pathname === baseUrl ? "tab-activa" : ""}>
            <Link href={baseUrl} style={{ display: "block", color: "inherit", textDecoration: "none" }}>Profile</Link>
          </li>
          <li role="menuitem" className={pathname === `${baseUrl}/games` ? "tab-activa" : ""}>
            <Link href={`${baseUrl}/games`} style={{ display: "block", color: "inherit", textDecoration: "none" }}>Games</Link>
          </li>
          <li role="menuitem" className={pathname === `${baseUrl}/guides` ? "tab-activa" : ""}>
            <Link href={`${baseUrl}/guides`} style={{ display: "block", color: "inherit", textDecoration: "none" }}>Guides</Link>
          </li>
          <li role="menuitem" className={pathname === `${baseUrl}/network` ? "tab-activa" : ""}>
            <Link href={`${baseUrl}/network`} style={{ display: "block", color: "inherit", textDecoration: "none" }}>Network</Link>
          </li>
        </ul>

        <div style={{ minHeight: "500px" }}>
          {children}
        </div>

      </div>
    </div>
  );
}