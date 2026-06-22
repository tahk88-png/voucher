"use client";
import { motion } from "motion/react";

type Props = {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
};

export function GradientText({
  children,
  className = "",
  from = "var(--primary)",
  via = "#e67e22",
  to = "var(--primary-hover)",
}: Props) {
  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundSize: "200% 200%",
        backgroundImage: `linear-gradient(90deg, ${from}, ${via}, ${to}, ${from})`,
      }}
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
}
