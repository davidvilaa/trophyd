"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileNetworkPage() {
  const params = useParams();
  const targetNickname = params.nickname as string;

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  useEffect(() => {
    const cargarNetwork = async () => {
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
        const targetId = profile.id;

        const { data: followersData } = await supabase
          .from("follows")
          .select("profiles!follows_follower_id_fkey(id, nickname, pfp_url)")
          .eq("following_id", targetId);

        const { data: followingData } = await supabase
          .from("follows")
          .select("profiles!follows_following_id_fkey(id, nickname, pfp_url)")
          .eq("follower_id", targetId);

        if (followersData) setFollowers(followersData.map((f: any) => Array.isArray(f.profiles) ? f.profiles[0] : f.profiles));
        if (followingData) setFollowing(followingData.map((f: any) => Array.isArray(f.profiles) ? f.profiles[0] : f.profiles));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (targetNickname) cargarNetwork();
  }, [targetNickname]);

  const handleFollow = async (targetIdToFollow: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: targetIdToFollow });
      
      if (!error) {
        const targetUser = followers.find((f) => f.id === targetIdToFollow);
        if (targetUser) setFollowing((prev) => [...prev, targetUser]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Cargando network...</div>;

  return (
    <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
      <fieldset style={{ flex: 1, padding: "20px", backgroundColor: "#fff", minHeight: "300px" }}>
        <legend style={{ fontSize: "18px" }}>Followers</legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {followers.length > 0 ? (
            followers.map((user) => {
              const isFollowingBack = following.some((f) => f.id === user.id);
              return (
                <div key={user.id} style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ width: "55px", height: "55px", flexShrink: 0, border: "2px inset #fff", backgroundColor: "#ccc", backgroundImage: `url(${user.pfp_url || 'https://www.gravatar.com/avatar/0?d=mp&f=y'})`, backgroundSize: "cover", backgroundPosition: "center" }}></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontWeight: "bold", fontSize: "16px" }}>{user.nickname}</span>
                    {currentUserId && currentUserId !== user.id && !isFollowingBack && (
                      <button onClick={() => handleFollow(user.id)} style={{ padding: "2px 10px", fontSize: "12px", width: "fit-content" }}>Follow</button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: "#666" }}>Aún no tiene seguidores.</p>
          )}
        </div>
      </fieldset>

      <fieldset style={{ flex: 1, padding: "20px", backgroundColor: "#fff", minHeight: "300px" }}>
        <legend style={{ fontSize: "18px" }}>Following</legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {following.length > 0 ? (
            following.map((user) => (
              <div key={user.id} style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ width: "55px", height: "55px", flexShrink: 0, border: "2px inset #fff", backgroundColor: "#ccc", backgroundImage: `url(${user.pfp_url || 'https://www.gravatar.com/avatar/0?d=mp&f=y'})`, backgroundSize: "cover", backgroundPosition: "center" }}></div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "16px" }}>{user.nickname}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#666" }}>No sigue a nadie todavía.</p>
          )}
        </div>
      </fieldset>
    </div>
  );
}