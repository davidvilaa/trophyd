"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import GuideCaseCard from "@/components/cards/guideCard";

export default function ProfileGuidesPage() {
  const params = useParams();
  const router = useRouter();
  const targetNickname = params.nickname as string;

  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const cargarGuias = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setCurrentUserId(session.user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("nickname", targetNickname)
          .single();

        if (!profile) return;

        const { data: guidesData } = await supabase
          .from("guides")
          .select(`id, title, average_time, average_difficulty, cover_url, user_id, games (id, title, cover_image_url), profiles!guides_user_id_fkey (nickname)`)
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (guidesData) setGuides(guidesData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (targetNickname) cargarGuias();
  }, [targetNickname]);

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Cargando guías...</div>;

  return (
    <fieldset style={{ padding: "20px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "0px" }}>
      <legend style={{ fontSize: "18px" }}>Published Guides</legend>
      <div style={{ display: "flex", alignItems: "center", paddingBottom: "10px", borderBottom: "0px solid #ccc" }}>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
        {guides.length > 0 ? (
          guides.map((guia) => (
            <GuideCaseCard
              key={guia.id}
              guideData={guia}
              subtitle={guia.games.title}
              onClick={() => {
                if (currentUserId === guia.user_id) {
                  router.push(`/game/${guia.games.id}/write-guide?guideId=${guia.id}`);
                } else {
                  router.push(`/game/${guia.games.id}/guide/${guia.id}`);
                }
              }}
            />
          ))
        ) : (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#666", padding: "20px 0" }}>Aún no ha publicado ninguna guía.</p>
        )}
      </div>
    </fieldset>
  );
}