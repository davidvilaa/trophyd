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

export default function GuideCaseCard({ 
  guideData, 
  onClick,
  subtitle 
}: { 
  guideData: any; 
  onClick?: () => void;
  subtitle?: string;
}) {
  const bgImage = guideData.cover_url || guideData.games?.cover_image_url;

  return (
    <div className="guide-case-container" title={guideData.title} onClick={onClick}>
      <style>{`
        .guide-case-container {
          position: relative;
          cursor: pointer;
          perspective: 1000px;
          aspect-ratio: 1/1; 
          z-index: 1;
        }

        .guide-case {
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
        }

        .guide-case-container:hover {
          z-index: 20;
        }

        .guide-case-container:hover .guide-case {
          transform: rotateX(8deg) rotateY(-8deg) scale(1.1) translateZ(30px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3) !important;
        }

        .guide-info-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
          padding: 20px 10px 10px 10px;
          color: white;
          display: flex;
          flex-direction: column;
          gap: 2px;
          z-index: 5;
        }

        .guide-badges-area {
          position: absolute;
          top: 8px;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: row;
          justify-content: center;
          gap: 5px;
          padding: 0 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
          transform: translateZ(40px);
          transform-style: preserve-3d;
          z-index: 10;
        }

        .guide-case-container:hover .guide-badges-area {
          opacity: 1;
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
          gap: 4px;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 3px rgba(0, 0, 0, 0.5), 0 4px 10px rgba(0, 0, 0, 0.6);
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
      `}</style>

      <div 
        className="guide-case" 
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="guide-badges-area">
          <div className="embedded-badge" title="Difficulty" style={{ backgroundColor: getDifficultyColor(guideData.average_difficulty) }}>
            <Dumbbell size={16} />
            <span>{guideData.average_difficulty ? `${guideData.average_difficulty}/10` : "--/10"}</span>
          </div>
          <div className="embedded-badge" title="Time" style={{ backgroundColor: getTimeColor(guideData.average_time) }}>
            <Clock size={16} />
            <span>{guideData.average_time ? `${guideData.average_time}h` : "--h"}</span>
          </div>
        </div>

        <div className="guide-info-gradient">
          <div style={{ fontSize: "13px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={guideData.title}>
            {guideData.title}
          </div>
          {subtitle && (
            <div style={{ fontSize: "10px", color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={subtitle}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}