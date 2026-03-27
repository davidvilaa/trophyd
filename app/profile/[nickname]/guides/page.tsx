"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileGuidesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState<any[]>([]);

  useEffect(() => {
    const cargarGuias = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/");
          return;
        }

        const userId = session.user.id;

        const { data: guidesData } = await supabase
          .from("guides")
          .select(`
            id,
            title,
            average_time,
            average_difficulty,
            games (
              title,
              cover_image_url
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (guidesData) {
          setGuides(guidesData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    cargarGuias();
  }, [router]);

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Cargando guías...</div>;
  }

  return (
    <fieldset style={{ padding: "20px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "20px" }}>
      <legend style={{ fontSize: "18px" }}>Published Guides</legend>

      <div style={{ display: "flex", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #ccc" }}>
        <div style={{ fontWeight: "bold", color: "#666" }}>
          Total Guides: {guides.length}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
        {guides.length > 0 ? (
          guides.map((guia) => (
            <div 
              key={guia.id} 
              style={{ 
                aspectRatio: "1/1", 
                backgroundColor: "#e5e7eb", 
                border: "2px inset #fff",
                backgroundImage: `url(${guia.games.cover_image_url})`, 
                backgroundSize: "cover", 
                backgroundPosition: "center",
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0) 100%)",
                padding: "30px 10px 10px 10px",
                color: "white",
                display: "flex",
                flexDirection: "column",
                gap: "5px"
              }}>
                <div style={{ fontSize: "14px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={guia.title}>
                  {guia.title}
                </div>
                
                <div style={{ fontSize: "11px", color: "#ddd", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={guia.games.title}>
                  {guia.games.title}
                </div>

                <div style={{ display: "flex", gap: "6px", marginTop: "8px", justifyContent: "flex-end", paddingRight: "5px" }}>
                  <div style={{
                    backgroundColor: "#b91c1c",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap"
                  }}>
                    Diff: {guia.average_difficulty}/10
                  </div>
                  <div style={{
                    backgroundColor: "#1d4ed8",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap"
                  }}>
                    Time: {guia.average_time}h
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#666", padding: "20px 0" }}>
            Aún no has publicado ninguna guía.
          </p>
        )}
      </div>
    </fieldset>
  );
}