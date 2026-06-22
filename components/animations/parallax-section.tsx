"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

type Props = {
  children: React.ReactNode;
  className?: string;
  speed?: number;
};

export function ParallaxSection({ children, className = "", speed = 0.3 }: Props) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * -100, speed * 100]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
