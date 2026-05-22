"use client";

import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
}

export function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Initialize particles
        const particleCount = 150;
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            radius: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.5 + 0.3,
        }));

        // Mouse tracking
        const handleMouse = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouse);

        // Animation loop
        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw fog gradients (very subtle)
            const gradient1 = ctx.createRadialGradient(
                canvas.width * 0.3,
                canvas.height * 0.2,
                0,
                canvas.width * 0.3,
                canvas.height * 0.2,
                canvas.width * 0.5
            );
            gradient1.addColorStop(0, 'rgba(139, 92, 246, 0.03)');
            gradient1.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient1;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const gradient2 = ctx.createRadialGradient(
                canvas.width * 0.7,
                canvas.height * 0.8,
                0,
                canvas.width * 0.7,
                canvas.height * 0.8,
                canvas.width * 0.4
            );
            gradient2.addColorStop(0, 'rgba(217, 70, 239, 0.02)');
            gradient2.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient2;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particlesRef.current.forEach((particle) => {
                // Mouse interaction
                const dx = mouseRef.current.x - particle.x;
                const dy = mouseRef.current.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 150;

                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance;
                    particle.vx -= (dx / distance) * force * 0.2;
                    particle.vy -= (dy / distance) * force * 0.2;
                }

                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Damping
                particle.vx *= 0.98;
                particle.vy *= 0.98;

                // Boundary check
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

                // Clamp position
                particle.x = Math.max(0, Math.min(canvas.width, particle.x));
                particle.y = Math.max(0, Math.min(canvas.height, particle.y));

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
                ctx.fill();

                // Add glow
                const glow = ctx.createRadialGradient(
                    particle.x,
                    particle.y,
                    0,
                    particle.x,
                    particle.y,
                    particle.radius * 3
                );
                glow.addColorStop(0, `rgba(139, 92, 246, ${particle.opacity * 0.3})`);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.fill();
            });

            // Draw connections
            particlesRef.current.forEach((p1, i) => {
                particlesRef.current.slice(i + 1).forEach((p2) => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - distance / 100) * 0.1})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouse);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ background: 'transparent' }}
        />
    );
}
