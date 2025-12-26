"use client";

import React from 'react';

const CoreLoader = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-transparent">
      <div className="loader-wrapper">
        <svg viewBox="0 0 100 100" className="loader-svg">
          <defs>
            <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#1e1b4b', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#000000', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          <g className="points">
            {/* Central Core */}
            <circle fill="url(#coreGradient)" r="50" cy="50" cx="50" className="ciw" />

            {/* Orbiting Node 1 (Purple - Talent) */}
            <circle r="4" cy="50" cx="5" className="ci2" />

            {/* Orbiting Node 2 (Cyan - Job) */}
            <circle r="4" cy="50" cx="95" className="ci1" />
          </g>
        </svg>

        {/* Embedded Scoped CSS for Animation */}
        <style jsx>{`
          .loader-wrapper {
            width: 150px;
            max-height: 900px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .loader-svg {
            overflow: visible;
            filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.5));
            width: 100%;
          }

          .ci1 {
            fill: #8b5cf6; /* Electric Purple */
            animation: toBig 3s infinite -1.5s;
            transform-box: fill-box;
            transform-origin: 50% 50%;
          }

          .ciw {
            transform-box: fill-box;
            transform-origin: 50% 50%;
            animation: breath 3s infinite;
            stroke: rgba(255, 255, 255, 0.1);
            stroke-width: 1px;
          }

          .ci2 {
            fill: #8b5cf6; /* Violet-500 (Hashtag Color) */
            animation: toBig2 3s infinite;
            transform-box: fill-box;
            transform-origin: 50% 50%;
          }

          .points {
            animation: rot 3s infinite;
            transform-box: fill-box;
            transform-origin: 50% 50%;
          }

          @keyframes rot {
            0% { transform: rotate(0deg); }
            30% { transform: rotate(360deg); }
            50% { transform: rotate(360deg); }
            80% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }

          @keyframes toBig {
            0% { transform: scale(1) translateX(0px); }
            30% { transform: scale(1) translateX(0px); }
            50% { transform: scale(10) translateX(-4.5px); }
            80% { transform: scale(10) translateX(-4.5px); }
            100% { transform: scale(1) translateX(0px); }
          }

          @keyframes toBig2 {
            0% { transform: scale(1) translateX(0px); }
            30% { transform: scale(1) translateX(0px); }
            50% { transform: scale(10) translateX(4.5px); }
            80% { transform: scale(10) translateX(4.5px); }
            100% { transform: scale(1) translateX(0px); }
          }

          @keyframes breath {
            15% { transform: scale(1); }
            40% { transform: scale(1.1); }
            65% { transform: scale(1); }
            90% { transform: scale(1.1); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CoreLoader;
