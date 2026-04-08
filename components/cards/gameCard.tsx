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

export default function GameCaseCard({ 
  gameData, 
  onClick, 
  isEmpty = false 
}: { 
  gameData?: any; 
  onClick?: () => void; 
  isEmpty?: boolean;
}) {
  
  if (isEmpty || !gameData) {
    return (
      <div className="game-case-container empty-case">
        <style>{`
          .game-case-container {
            position: relative;
            perspective: 1000px;
            aspect-ratio: 3/4;
            z-index: 1;
          }
          .game-case-container.empty-case {
            cursor: default;
          }
          .game-case-empty {
            width: 100%;
            height: 100%;
            border: 2px inset #fff;
            background-color: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            font-size: 2rem;
          }
        `}</style>
        <div className="game-case-empty">--</div>
      </div>
    );
  }

  return (
    <div className="game-case-container has-game" title={gameData.games?.title} onClick={onClick}>
      <style>{`
        .game-case-container {
          position: relative;
          perspective: 1000px;
          aspect-ratio: 3/4;
          z-index: 1;
        }
        .game-case-container.has-game {
          cursor: pointer;
        }
        .game-case {
          width: 100%;
          height: 100%;
          position: relative;
          background-size: cover;
          background-position: center;
          border: 2px inset #fff;
          background-color: #e5e7eb;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transform-style: preserve-3d;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
          z-index: 10;
        }
        .game-case-container:hover {
          z-index: 20;
        }
        .game-case-container:hover .game-case {
          transform: rotateX(8deg) rotateY(-8deg) scale(1.15) translateZ(30px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3) !important;
        }
        .case-overlay-container {
          position: absolute;
          top: 0; bottom: 0; left: 0; right: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
          transform-style: preserve-3d;
          pointer-events: none;
        }
        .game-case-container:hover .case-overlay-container {
          opacity: 1;
        }
        .badges-row {
          position: absolute;
          top: 8px;
          left: 0; right: 0;
          display: flex;
          justify-content: center;
          gap: 4px;
          padding: 0 8px;
          transform: translateZ(30px);
          transform-style: preserve-3d;
        }
        .embedded-badge {
          flex: 1 1 0%;
          justify-content: center;
          background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 49%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.6) 100%);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-top-color: rgba(255, 255, 255, 0.7); 
          border-bottom-color: rgba(0, 0, 0, 0.8);   
          border-radius: 6px;
          color: #fff;
          padding: 2px 4px;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 3px;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 3px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.5);
          text-transform: capitalize;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 1px 2px rgba(0,0,0,0.9);
        }
        .embedded-badge svg {
          stroke-width: 2.5px;
          color: #fff;
          flex-shrink: 0;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.8));
        }
        .stars-row {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%) translateZ(40px); 
          display: flex;
          justify-content: center;
          gap: 6px;
          font-size: 2.2rem;
          color: rgba(255, 255, 255, 0.4); 
          width: max-content;
          transform-style: preserve-3d;
          pointer-events: auto;
        }
        .stars-row span {
          transition: color 0.15s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.15s ease;
          filter: drop-shadow(0 5px 6px rgba(0,0,0,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.3));
          cursor: pointer;
        }
        .stars-row span:hover {
          transform: translateY(-6px) translateZ(20px) scale(1.3);
          color: #fbbf24;
          filter: drop-shadow(0 0 12px rgba(251, 191, 36, 1)) drop-shadow(0 8px 8px rgba(0,0,0,0.9));
        }
        .stars-row span.active {
          color: #fbbf24; 
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.7)) drop-shadow(0 3px 5px rgba(0,0,0,0.9));
        }
      `}</style>

      <div className="game-case" style={{ backgroundImage: `url(${gameData.games?.cover_image_url})` }}>
        <div className="case-overlay-container">
          <div className="badges-row">
            <div className="embedded-badge" title="Time Played" style={{ backgroundColor: getTimeColor(gameData.time_played) }}>
              <Clock size={16} />
              <span>{gameData.time_played ? `${gameData.time_played}h` : "--h"}</span>
            </div>
            <div className="embedded-badge" title="Difficulty" style={{ backgroundColor: getDifficultyColor(gameData.difficulty) }}>
              <Dumbbell size={16} />
              <span>{gameData.difficulty ? gameData.difficulty : "--"}</span>
            </div>
          </div>
          <div className="stars-row">
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