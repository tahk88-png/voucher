"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

type Particle = {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
};

const COLORS = ["#cc785c", "#5e7e92", "#be8a2e", "#4e8a5b", "#b5613f", "#7e9cae"];

export function useConfetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const fire = useCallback((originX = 0.5, originY = 0.5) => {
    const newParticles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: Date.now() + i,
      x: originX * 100,
      y: originY * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  }, []);

  return { particles, fire };
}

export function ConfettiOverlay({ particles }: { particles: Particle[] }) {
  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          {particles.map((p) => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 300;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance - 200;

            return (
              <motion.div
                key={p.id}
                initial={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  opacity: 1,
                  scale: 0,
                  rotate: 0,
                }}
                animate={{
                  x: endX,
                  y: endY,
                  opacity: 0,
                  scale: p.scale,
                  rotate: p.rotation + 360,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 + Math.random() * 0.5, ease: "easeOut" }}
                className="absolute w-3 h-3 rounded-sm"
                style={{ backgroundColor: p.color }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
