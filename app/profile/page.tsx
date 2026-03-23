"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  const user = {
    nickname: "NinjaTrophy99",
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla quam velit, vulputate eu pharetra nec, mattis ac neque. Duis vulputate commodo lectus, ac blandit elit tincidunt id.",
    pfp: "https://www.gravatar.com/avatar/0?d=mp&f=y"
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-black pt-10 pb-20 px-4">
      
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        <div style={{ display: "flex", gap: "30px", marginBottom: "40px", alignItems: "center" }}>
          <div style={{ 
            width: "150px", height: "150px", flexShrink: 0,
            border: "3px inset #fff", backgroundColor: "#ccc",
            backgroundImage: `url(${user.pfp})`, backgroundSize: "cover", backgroundPosition: "center"
          }}></div>
          
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "36px", fontWeight: "bold", color: "#111" }}>
              {user.nickname}
            </h1>
            <p style={{ margin: 0, color: "#444", lineHeight: "1.6", fontSize: "16px", maxWidth: "800px" }}>
              {user.bio}
            </p>
          </div>
        </div>

        <menu role="tablist" style={{ marginBottom: "20px", fontSize: "16px" }}>
          <li role="tab" aria-selected={activeTab === "profile"}>
            <a onClick={() => setActiveTab("profile")} style={{ cursor: "pointer", padding: "6px 20px" }}>Profile</a>
          </li>
          <li role="tab" aria-selected={activeTab === "games"}>
            <a onClick={() => setActiveTab("games")} style={{ cursor: "pointer", padding: "6px 20px" }}>Games</a>
          </li>
          <li role="tab" aria-selected={activeTab === "guides"}>
            <a onClick={() => setActiveTab("guides")} style={{ cursor: "pointer", padding: "6px 20px" }}>Guides</a>
          </li>
          <li role="tab" aria-selected={activeTab === "network"}>
            <a onClick={() => setActiveTab("network")} style={{ cursor: "pointer", padding: "6px 20px" }}>Network</a>
          </li>
        </menu>

        <article role="tabpanel" style={{ padding: "30px", minHeight: "500px", backgroundColor: "#ece9d8" }}>
          
          {activeTab === "profile" && (
            <div style={{ display: "flex", gap: "30px", alignItems: "stretch" }}>
              
              <fieldset style={{ width: "260px", padding: "20px", display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
                <legend style={{ fontSize: "18px" }}>Ratings</legend>
                
                <p style={{ margin: "0 0 25px 0", fontWeight: "bold", textAlign: "center", fontSize: "18px" }}>
                  Nota media: 3.9
                </p>
                
                <div style={{ 
                  display: "flex", alignItems: "flex-end", justifyContent: "space-between", 
                  height: "120px", marginTop: "auto", borderBottom: "2px solid #888", paddingBottom: "2px"
                }}>
                  <div style={{ width: "15%", height: "20%", backgroundColor: "#16a34a" }} title="1 Estrella"></div>
                  <div style={{ width: "15%", height: "10%", backgroundColor: "#16a34a" }} title="2 Estrellas"></div>
                  <div style={{ width: "15%", height: "50%", backgroundColor: "#16a34a" }} title="3 Estrellas"></div>
                  <div style={{ width: "15%", height: "90%", backgroundColor: "#16a34a" }} title="4 Estrellas"></div>
                  <div style={{ width: "15%", height: "60%", backgroundColor: "#16a34a" }} title="5 Estrellas"></div>
                </div>
              </fieldset>

              <fieldset style={{ flex: 1, padding: "20px", backgroundColor: "#fff" }}>
                <legend style={{ fontSize: "18px" }}>Favorite Games</legend>
                
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", 
                  gap: "20px",
                }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} style={{ 
                      aspectRatio: "3/4", backgroundColor: "#e5e7eb", border: "2px inset #fff",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "2rem"
                    }}>
                      🖼️
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {activeTab === "games" && <h2 style={{ fontSize: "24px" }}>Tu colección de juegos aparecerá aquí...</h2>}
          {activeTab === "guides" && <h2 style={{ fontSize: "24px" }}>Tus guías publicadas aparecerán aquí...</h2>}
          {activeTab === "network" && <h2 style={{ fontSize: "24px" }}>Red social y amigos...</h2>}
          
        </article>

      </div>
    </div>
  );
}