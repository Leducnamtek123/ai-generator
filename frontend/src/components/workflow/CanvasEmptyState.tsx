'use client';

import * as React from 'react';
import { NODE_CONFIG, QUICK_START_NODES } from './types';
import { cn } from '@/lib/utils';

interface CanvasEmptyStateProps {
    onAddNode: (type: string, label: string) => void;
}

// Particle animation component
function ParticlesBackground() {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particles
        const particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = [];
        const particleCount = 80;

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.1,
            });
        }

        // Animation loop
        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Detect theme from document body/classList
            const isDark = document.documentElement.classList.contains('dark');
            const particleColor = isDark ? '255, 255, 255' : '0, 0, 0';

            // Draw particles
            particles.forEach((particle) => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
                ctx.fill();

                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;
            });

            // Draw some connection lines between nearby particles
            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach((p2) => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(${particleColor}, ${0.03 * (1 - distance / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: 0.6 }}
        />
    );
}

export function CanvasEmptyState({ onAddNode }: CanvasEmptyStateProps) {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none bg-background overflow-hidden transition-colors duration-300">
            {/* Animated particles background */}
            <ParticlesBackground />

            {/* Decorative curved dashed lines */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15] dark:opacity-20"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" className="fill-foreground/10" />
                    </pattern>
                </defs>
                {/* Curved path top */}
                <path
                    d="M 100 50 Q 400 150, 700 80 T 1200 100"
                    className="stroke-foreground/20 animate-dash"
                    strokeWidth="1"
                    strokeDasharray="8 8"
                    fill="none"
                />
                {/* Curved path bottom */}
                <path
                    d="M 50 400 Q 350 500, 650 420 T 1150 480"
                    className="stroke-foreground/20 animate-dash"
                    strokeWidth="1"
                    strokeDasharray="8 8"
                    fill="none"
                />
                {/* Curved path right */}
                <path
                    d="M 900 100 Q 1000 300, 950 500 T 1100 700"
                    className="stroke-foreground/10"
                    strokeWidth="1"
                    strokeDasharray="6 6"
                    fill="none"
                />
            </svg>

            {/* Main content */}
            <div className="pointer-events-auto text-center space-y-10 max-w-4xl px-6 relative z-10">
                <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                        Your workflow is ready
                    </h1>
                    <p className="text-muted-foreground text-base md:text-lg">
                        Choose your first node and start creating
                    </p>
                </div>

                {/* Node Selection Grid */}
                <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                    {QUICK_START_NODES.map((type) => {
                        const config = NODE_CONFIG[type];
                        const Icon = config.icon;

                        // Color mapping for each node type
                        const colorStyles: Record<string, { bg: string; border: string; iconBg: string }> = {
                            media: { bg: 'bg-card', border: 'border-border', iconBg: 'bg-muted' },
                            text: { bg: 'bg-card', border: 'border-green-500/20', iconBg: 'bg-green-500/10' },
                            image_gen: { bg: 'bg-card', border: 'border-blue-500/20', iconBg: 'bg-blue-500/10' },
                            video_gen: { bg: 'bg-card', border: 'border-green-500/20', iconBg: 'bg-green-500/10' },
                            assistant: { bg: 'bg-card', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/10' },
                        };

                        const colors = colorStyles[type] || colorStyles.media;

                        return (
                            <button
                                key={type}
                                onClick={() => onAddNode(config.type, config.label)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3 w-28 md:w-32 h-28 md:h-32",
                                    "rounded-xl border transition-all duration-200 shadow-sm",
                                    "hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20",
                                    "active:scale-95 group",
                                    colors.bg,
                                    colors.border,
                                    "hover:border-primary/20"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                    colors.iconBg,
                                    "group-hover:bg-primary/10"
                                )}>
                                    <Icon className={cn("w-5 h-5", config.color.replace('text-white', 'text-foreground'))} />
                                </div>
                                <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    {config.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Keyboard shortcut hint */}
                <p className="text-xs text-muted-foreground/40">
                    Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-mono inline-block">+</kbd> or click the toolbar to add nodes
                </p>
            </div>
        </div>
    );
}
