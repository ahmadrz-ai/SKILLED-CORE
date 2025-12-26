import React from "react";

export const QodeeLogo = ({ className }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="qodee-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" /> {/* Violet-500 */}
                    <stop offset="100%" stopColor="#2dd4bf" /> {/* Teal-400 */}
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Outer Hexagon-like Shield */}
            <path
                d="M50 5 L90 25 V75 L50 95 L10 75 V25 Z"
                stroke="url(#qodee-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-50"
            />

            {/* Inner 'Q' / Circuit Shape */}
            <path
                d="M50 20 C66.5685 20 80 33.4315 80 50 C80 66.5685 66.5685 80 50 80 C33.4315 80 20 66.5685 20 50 C20 33.4315 33.4315 20 50 20 Z"
                stroke="url(#qodee-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                className="animate-pulse"
            />

            {/* The 'Tail' of the Q / Data Stream */}
            <path
                d="M65 65 L80 80"
                stroke="url(#qodee-gradient)"
                strokeWidth="6"
                strokeLinecap="round"
            />

            {/* Central Core */}
            <circle cx="50" cy="50" r="10" fill="url(#qodee-gradient)" filter="url(#glow)">
                <animate
                    attributeName="opacity"
                    values="0.8;1;0.8"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </circle>
        </svg>
    );
};
