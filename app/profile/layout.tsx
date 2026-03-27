"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ nickname: "", bio: "", pfp: "" });

  useEffect(() => {
    const cargarPerfil = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("nickname, bio, pfp_url")
          .eq("id", session.user.id)
          .single();

        if (profileData) {
          setUserProfile({
            nickname: profileData.nickname || "Usuario",
            bio: profileData.bio || "Este usuario aún no ha escrito una biografía.",
            pfp: profileData.pfp_url || "https://www.gravatar.com/avatar/0?d=mp&f=y"
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, [router]);

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
          .game-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            cursor: pointer;
          }
          .game-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          }
        `}</style>

        <ul role="menubar" style={{ marginBottom: "30px", fontSize: "16px" }}>
          <li role="menuitem" className={pathname === "/profile" ? "tab-activa" : ""}>
            <Link href="/profile" style={{ display: "block", color: "inherit", textDecoration: "none" }}>Profile</Link>
          </li>
          <li role="menuitem" className={pathname === "/profile/games" ? "tab-activa" : ""}>
            <Link href="/profile/games" style={{ display: "block", color: "inherit", textDecoration: "none" }}>Games</Link>
          </li>
          <li role="menuitem" className={pathname === "/profile/guides" ? "tab-activa" : ""}>
            <Link href="/profile/guides" style={{ display: "block", color: "inherit", textDecoration: "none" }}>Guides</Link>
          </li>
          <li role="menuitem" className={pathname === "/profile/network" ? "tab-activa" : ""}>
            <Link href="/profile/network" style={{ display: "block", color: "inherit", textDecoration: "none" }}>Network</Link>
          </li>
        </ul>

        <div style={{ minHeight: "500px" }}>
          {children}
        </div>

      </div>
    </div>
  );
}