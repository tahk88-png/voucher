"use client";
import { useRef, useEffect, useState } from "react";
import { useInView, animate } from "motion/react";

type Props = {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
};

export function CountUp({ target, prefix = "", suffix = "", duration = 2, className, decimals = 0 }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, target, {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate(value) {
        setDisplay(decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString());
      },
    });

    return () => controls.stop();
  }, [isInView, target, duration, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
