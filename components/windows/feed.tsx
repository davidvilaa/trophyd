"use client";

import { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Activity, Trophy, Play, Pause, XCircle, Gift, Clock, Flame } from "lucide-react";
import MiniGameCaseCard from "@/components/cards/MINIgameCard";
import MiniGuideCaseCard from "@/components/cards/MINIguideCard";

const timeAgo = (dateString: string) => {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "ahora mismo";
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return `ayer`;
  return `hace ${diffDays}d`;
};

const getStatusConfig = (status: string) => {
  switch(status) {
    case 'completed': 
      return { text: 'ha completado', color: "#4a7c59", icon: <Trophy size={14} /> };
    case 'playing': 
      return { text: 'ha empezado a jugar a', color: "#4a69bd", icon: <Play size={14} /> };
    case 'paused': 
      return { text: 'ha pausado', color: "#7f8c8d", icon: <Pause size={14} /> };
    case 'dropped': 
      return { text: 'ha abandonado', color: "#a55c5c", icon: <XCircle size={14} /> };
    case 'wishlist': 
      return { text: 'quiere jugar a', color: "#8e7cc3", icon: <Gift size={14} /> };
    case 'guide_created':
      return { text: 'ha publicado una guía de', color: "#ff7b00", icon: <Flame size={14} fill="#ff7b00" /> };
    default: 
      return { text: 'ha logueado', color: "#636e72", icon: <Activity size={14} /> };
  }
};

export default function FeedWindow() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("friends");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const feedRef = useRef(null);

  const getPfpUrl = (path: string | null) => {
    if (!path) return "https://i.pinimg.com/736x/83/bc/8b/83bc8b88cf6bc4b4e04d153a418cde62.jpg";
    if (path.startsWith("http")) return path;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const comprobarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }
    };
    comprobarSesion();
  }, []);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);

      const baseQueryGames = `
        user_id,
        game_id,
        status,
        created_at,
        rating,
        difficulty,
        time_played,
        profiles ( nickname, pfp_url ),
        games ( id, title, cover_image_url )
      `;

      const baseQueryGuides = `
        id,
        user_id,
        game_id,
        created_at,
        title,
        average_time,
        average_difficulty,
        profiles:guides_user_id_fkey ( nickname, pfp_url ),
        games ( id, title, cover_image_url )
      `;

      let logsData: any[] = [];
      let guidesData: any[] = [];

      if (activeTab === "global") {
        const [logsRes, guidesRes] = await Promise.all([
          supabase.from('user_games').select(baseQueryGames).order('created_at', { ascending: false }).limit(20),
          supabase.from('guides').select(baseQueryGuides).order('created_at', { ascending: false }).limit(20)
        ]);

        if (!logsRes.error) logsData = logsRes.data || [];
        if (!guidesRes.error) guidesData = guidesRes.data || [];

      } else if (activeTab === "friends") {
        if (!currentUserId) {
          setFeed([]);
          setLoading(false);
          return;
        }

        const { data: followsData, error: followsError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId);

        const friendIds = (!followsError && followsData) ? followsData.map(f => f.following_id) : [];
        const targetIds = [...friendIds, currentUserId];

        const [logsRes, guidesRes] = await Promise.all([
          supabase.from('user_games').select(baseQueryGames).in('user_id', targetIds).order('created_at', { ascending: false }).limit(20),
          supabase.from('guides').select(baseQueryGuides).in('user_id', targetIds).order('created_at', { ascending: false }).limit(20)
        ]);

        if (!logsRes.error) logsData = logsRes.data || [];
        if (!guidesRes.error) guidesData = guidesRes.data || [];
      }

      const formattedGuides = guidesData.map(g => ({
        ...g,
        status: 'guide_created',
        isGuide: true
      }));

      const combinedFeed = [...logsData, ...formattedGuides]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

      setFeed(combinedFeed);
      setLoading(false);
    };

    fetchFeed();
  }, [activeTab, currentUserId]);

  return (
    <Draggable handle=".title-bar" nodeRef={feedRef} defaultPosition={{ x: 0, y: 0 }}>
      <div 
        ref={feedRef} 
        className="window glass active" 
        style={{ width: "400px", position: "absolute", left: "50px", top: "50px", zIndex: 10 }}
      >
        <div className="title-bar" style={{ cursor: "grab" }}>
          <div className="title-bar-text" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Activity size={14} /> Actividad
          </div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>

        <div className="window-body has-space" style={{ margin: 0, padding: 0 }}>
          
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

          <ul role="menubar" style={{ margin: 0, padding: "2px 2px", fontSize: "14px", backgroundColor: "transparent", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
            <li 
              role="menuitem" 
              tabIndex={0} 
              className={activeTab === "friends" ? "tab-activa" : ""}
              onClick={() => setActiveTab("friends")}
              style={{ cursor: "pointer", padding: "4px 10px" }}
            >
              Amigos
            </li>
            <li 
              role="menuitem" 
              tabIndex={0} 
              className={activeTab === "global" ? "tab-activa" : ""}
              onClick={() => setActiveTab("global")}
              style={{ cursor: "pointer", padding: "4px 10px" }}
            >
              Global
            </li>
          </ul>
          
          <div style={{ padding: "10px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>Cargando...</div>
            ) : activeTab === "friends" && !currentUserId ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "12px" }}>
                Inicia sesión para ver la actividad de tus amigos.
              </div>
            ) : feed.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666", fontSize: "12px" }}>
                Aún no hay actividad.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "470px", overflowY: "auto", paddingRight: "5px" }}>
                {feed.map((item) => {
                  if (!item.profiles || !item.games) return null;

                  const uniqueKey = item.isGuide ? `guide-${item.id}` : `game-${item.user_id}-${item.game_id}-${item.created_at}`;
                  const statusConfig = getStatusConfig(item.status);
                  const userPfpUrl = getPfpUrl(item.profiles.pfp_url);
                  
                  const actionLink = item.isGuide 
                    ? `/game/${item.games.id}/guide/${item.id}`
                    : `/game/${item.games.id}`;

                  return (
                    <div 
                      key={uniqueKey} 
                      style={{ 
                        display: "flex", gap: "15px", alignItems: "flex-start", 
                        padding: "12px", 
                        backgroundColor: item.isGuide ? "rgba(255, 123, 0, 0.05)" : "rgba(255, 255, 255, 0.7)", 
                        border: item.isGuide ? "1px solid rgba(255, 123, 0, 0.2)" : "1px solid rgba(255, 255, 255, 0.5)", 
                        borderRadius: "6px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                      }}
                    >
                      {/* CROMO CONDICIONAL */}
                      <div style={{ width: item.isGuide ? "70px" : "50px", flexShrink: 0 }}>
                        {item.isGuide ? (
                          <MiniGuideCaseCard 
                            guideData={item} 
                            onClick={() => window.location.href = actionLink}
                          />
                        ) : (
                          <MiniGameCaseCard 
                            gameData={item} 
                            onClick={() => window.location.href = actionLink}
                          />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                        
                        {/* Cabecera: Avatar, Nombre y Tiempo (SIN NEGRITA) */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <img 
                              src={userPfpUrl} 
                              alt={item.profiles.nickname} 
                              style={{ width: "18px", height: "18px", borderRadius: "2px", objectFit: "cover", border: "1px solid rgba(0,0,0,0.2)" }} 
                            />
                            <Link href={`/profile/${item.profiles.nickname}`} style={{ fontSize: "13px", color: "#0055cc", textDecoration: "none" }}>
                              {item.profiles.nickname}
                            </Link>
                          </div>
                          <div style={{ fontSize: "10px", color: "#777", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Clock size={10} /> {timeAgo(item.created_at)}
                          </div>
                        </div>
                        
                        {/* TEXTO EN DOS LÍNEAS (Todo en minúsculas y sin negrita) */}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "4px", 
                            fontSize: "12px", 
                            color: statusConfig.color,
                            textTransform: "none", // Forzamos minúsculas
                            letterSpacing: "0px"
                          }}>
                            {statusConfig.icon} {statusConfig.text}
                          </span>
                          
                          <Link 
                            href={actionLink} 
                            style={{ 
                              color: "#333", 
                              textDecoration: "none", 
                              fontSize: "14px", 
                              marginTop: "1px",
                              whiteSpace: "nowrap", 
                              overflow: "hidden", 
                              textOverflow: "ellipsis", 
                              maxWidth: "100%" 
                            }}
                          >
                            {item.games.title}
                          </Link>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
}