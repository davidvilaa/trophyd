"use client";

import { Clock, Dumbbell, Heart } from "lucide-react";

const getDifficultyColor = (diff: number | null | undefined) => {
  if (!diff) return "rgba(20, 30, 40, 0.5)";
  const d = Math.round(Number(diff));
  if (d <= 3) return "rgba(21, 128, 61, 0.6)";
  if (d <= 5) return "rgba(101, 163, 13, 0.6)";
  if (d <= 7) return "rgba(202, 138, 4, 0.6)";
  if (d === 8) return "rgba(194, 65, 12, 0.6)";
  if (d === 9) return "rgba(185, 28, 28, 0.6)";
  return "rgba(127, 29, 29, 0.8)";
};

const getTimeColor = (hours: number | null | undefined) => {
  if (!hours) return "rgba(20, 30, 40, 0.5)"; 
  const h = Number(hours);
  if (h <= 5) return "rgba(21, 128, 61, 0.6)";
  if (h <= 10) return "rgba(101, 163, 13, 0.6)";
  if (h <= 30) return "rgba(202, 138, 4, 0.6)";
  if (h <= 50) return "rgba(217, 119, 6, 0.6)";
  if (h <= 80) return "rgba(194, 65, 12, 0.6)";
  if (h <= 100) return "rgba(154, 52, 18, 0.6)";
  if (h <= 300) return "rgba(185, 28, 28, 0.6)";
  return "rgba(127, 29, 29, 0.8)";
};

export default function MiniGuideCaseCard({ 
  guideData, 
  onClick 
}: { 
  guideData: any; 
  onClick?: () => void; 
}) {
  
  if (!guideData) return null;
  const bgImage = guideData.cover_url || guideData.games?.cover_image_url;

  return (
    <div className="mini-guide-case-container" title={guideData.title} onClick={onClick}>
      <style>{`
        .mini-guide-case-container {
          position: relative;
          perspective: 800px;
          aspect-ratio: 1/1;
          z-index: 1;
          cursor: pointer;
        }
        .mini-guide-case {
          width: 100%;
          height: 100%;
          position: relative;
          background-size: cover;
          background-position: center;
          border: 1px inset #fff;
          background-color: #e5e7eb;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          transform-style: preserve-3d;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
          z-index: 10;
        }
        .mini-guide-case-container:hover {
          z-index: 20;
        }
        .mini-guide-case-container:hover .mini-guide-case {
          transform: rotateX(5deg) rotateY(-5deg) scale(1.1) translateZ(10px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.3) !important;
        }
        .mini-guide-overlay {
          position: absolute;
          top: 0; bottom: 0; left: 0; right: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
          transform-style: preserve-3d;
          pointer-events: none;
          background: rgba(0,0,0,0.3);
        }
        .mini-guide-case-container:hover .mini-guide-overlay {
          opacity: 1;
        }
        .mini-guide-badges-row {
          position: absolute;
          top: 4px;
          left: 0; right: 0;
          display: flex;
          justify-content: center;
          gap: 2px;
          padding: 0 4px;
          transform: translateZ(15px);
          transform-style: preserve-3d;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .mini-guide-case-container:hover .mini-guide-badges-row {
          opacity: 1;
        }
        .mini-guide-badge {
          flex: 1 1 0%;
          justify-content: center;
          background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 49%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.6) 100%);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-top-color: rgba(255, 255, 255, 0.7); 
          border-bottom-color: rgba(0, 0, 0, 0.8);   
          border-radius: 3px;
          color: #fff;
          padding: 1px 2px;
          font-size: 8px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 2px;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 2px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5);
          text-shadow: 0 1px 1px rgba(0,0,0,0.9);
        }
        .mini-guide-info-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
          padding: 10px 4px 4px 4px;
          color: white;
          z-index: 5;
          transform: translateZ(10px);
        }
      `}</style>

      <div className="mini-guide-case" style={{ backgroundImage: `url(${bgImage})` }}>
  
        <div className="mini-guide-overlay"></div>
        <div className="mini-guide-badges-row">
          <div className="mini-guide-badge" style={{ backgroundColor: "rgba(220, 38, 38, 0.65)" }}>
            <Heart size={8} fill="currentColor" strokeWidth={3} />
            <span>{guideData.likesCount !== undefined ? guideData.likesCount : "-"}</span>
          </div>
          <div className="mini-guide-badge" style={{ backgroundColor: getDifficultyColor(guideData.average_difficulty) }}>
            <Dumbbell size={8} strokeWidth={3} />
            <span>{guideData.average_difficulty ? guideData.average_difficulty : "-"}</span>
          </div>
          <div className="mini-guide-badge" style={{ backgroundColor: getTimeColor(guideData.average_time) }}>
            <Clock size={8} strokeWidth={3} />
            <span>{guideData.average_time ? guideData.average_time : "-"}</span>
          </div>
        </div>

        <div className="mini-guide-info-gradient">
          <div style={{ fontSize: "9px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={guideData.title}>
            {guideData.title || "Guía del juego"}
          </div>
        </div>

      </div>
    </div>
  );
}