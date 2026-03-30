"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserPlus, UserMinus } from "lucide-react";

export default function ProfileNetworkPage() {
  const params = useParams();
  const router = useRouter();
  const targetNickname = params.nickname as string;

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  
  const [myFollowingIds, setMyFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    const cargarNetwork = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let loggedUserId = null;
        if (session) {
          loggedUserId = session.user.id;
          setCurrentUserId(loggedUserId);
        }

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

        if (loggedUserId) {
          const { data: myFollows } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", loggedUserId);
          
          if (myFollows) {
            setMyFollowingIds(myFollows.map(f => f.following_id));
          }
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (targetNickname) cargarNetwork();
  }, [targetNickname]);

  const toggleFollowList = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUserId) return;
    try {
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);
        
        if (error) throw error;
        setMyFollowingIds(prev => prev.filter(id => id !== targetUserId));
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: targetUserId });
        
        if (error) throw error;
        setMyFollowingIds(prev => [...prev, targetUserId]);
      }
    } catch (error: any) {
      console.error("Error en la network:", error);
      alert("¡Supabase ha bloqueado el follow! Motivo: " + error.message);
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
              const amIFollowing = myFollowingIds.includes(user.id);
              return (
                <div key={user.id} style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div 
                    onClick={() => router.push(`/profile/${user.nickname}`)}
                    style={{ width: "55px", height: "55px", flexShrink: 0, border: "2px inset #fff", backgroundColor: "#ccc", backgroundImage: `url(${user.pfp_url || 'https://www.gravatar.com/avatar/0?d=mp&f=y'})`, backgroundSize: "cover", backgroundPosition: "center", cursor: "pointer" }}
                  ></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span 
                      onClick={() => router.push(`/profile/${user.nickname}`)}
                      style={{ fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
                    >
                      {user.nickname}
                    </span>
                    {currentUserId && currentUserId !== user.id && (
                      <button 
                        className="default"
                        onClick={() => toggleFollowList(user.id, amIFollowing)} 
                        style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 10px", fontSize: "12px", width: "fit-content" }}
                      >
                        {amIFollowing ? (
                          <>
                            <UserMinus size={14} strokeWidth={2.5} /> Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} strokeWidth={2.5} /> Follow
                          </>
                        )}
                      </button>
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
            following.map((user) => {
              const amIFollowing = myFollowingIds.includes(user.id);
              return (
                <div key={user.id} style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div 
                    onClick={() => router.push(`/profile/${user.nickname}`)}
                    style={{ width: "55px", height: "55px", flexShrink: 0, border: "2px inset #fff", backgroundColor: "#ccc", backgroundImage: `url(${user.pfp_url || 'https://www.gravatar.com/avatar/0?d=mp&f=y'})`, backgroundSize: "cover", backgroundPosition: "center", cursor: "pointer" }}
                  ></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span 
                      onClick={() => router.push(`/profile/${user.nickname}`)}
                      style={{ fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
                    >
                      {user.nickname}
                    </span>
                    {currentUserId && currentUserId !== user.id && (
                      <button 
                        className="default"
                        onClick={() => toggleFollowList(user.id, amIFollowing)} 
                        style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 10px", fontSize: "12px", width: "fit-content" }}
                      >
                        {amIFollowing ? (
                          <>
                            <UserMinus size={14} strokeWidth={2.5} /> Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} strokeWidth={2.5} /> Follow
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: "#666" }}>No sigue a nadie todavía.</p>
          )}
        </div>
      </fieldset>
    </div>
  );
}