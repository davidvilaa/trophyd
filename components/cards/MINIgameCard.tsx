"use client";

import { Clock, Dumbbell } from "lucide-react";

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

export default function MiniGameCaseCard({ 
  gameData, 
  onClick 
}: { 
  gameData: any; 
  onClick?: () => void; 
}) {
  
  if (!gameData) return null;

  return (
    <div className="mini-game-case-container" title={gameData.games?.title} onClick={onClick}>
      <style>{`
        .mini-game-case-container {
          position: relative;
          perspective: 800px;
          aspect-ratio: 3/4;
          z-index: 1;
          cursor: pointer;
        }
        .mini-game-case {
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
        .mini-game-case-container:hover {
          z-index: 20;
        }
        .mini-game-case-container:hover .mini-game-case {
          transform: rotateX(5deg) rotateY(-5deg) scale(1.1) translateZ(10px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.3) !important;
        }
        .mini-case-overlay {
          position: absolute;
          top: 0; bottom: 0; left: 0; right: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
          transform-style: preserve-3d;
          pointer-events: none;
          background: rgba(0,0,0,0.2);
        }
        .mini-game-case-container:hover .mini-case-overlay {
          opacity: 1;
        }
        .mini-badges-row {
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
        .mini-game-case-container:hover .mini-badges-row {
          opacity: 1;
        }
        .mini-badge {
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
        .mini-stars-row {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%) translateZ(20px); 
          display: flex;
          justify-content: center;
          gap: 1px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4); 
          width: max-content;
          transform-style: preserve-3d;
          pointer-events: auto;
        }
        .mini-stars-row span {
          transition: all 0.1s ease;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.9));
          cursor: pointer;
        }
        .mini-stars-row span.active {
          color: #fbbf24; 
          filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.7)) drop-shadow(0 2px 2px rgba(0,0,0,0.9));
        }
        .mini-stars-row span:hover {
          transform: translateY(-3px) translateZ(10px) scale(1.3);
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 1)) drop-shadow(0 4px 4px rgba(0,0,0,0.8));
        }
      `}</style>

      <div className="mini-game-case" style={{ backgroundImage: `url(${gameData.games?.cover_image_url})` }}>
        <div className="mini-case-overlay">
          <div className="mini-badges-row">
            <div className="mini-badge" style={{ backgroundColor: getTimeColor(gameData.time_played) }}>
              <Clock size={8} strokeWidth={3} />
              <span>{gameData.time_played ? `${gameData.time_played}` : "-"}</span>
            </div>
            <div className="mini-badge" style={{ backgroundColor: getDifficultyColor(gameData.difficulty) }}>
              <Dumbbell size={8} strokeWidth={3} />
              <span>{gameData.difficulty ? `${gameData.difficulty}` : "-"}</span>
            </div>
          </div>
          <div className="mini-stars-row">
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <span key={starIndex} className={gameData.rating && gameData.rating >= starIndex ? "active" : ""}>
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}