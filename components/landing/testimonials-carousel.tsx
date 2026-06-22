"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Kerli Tamm",
    role: "Owner, Tallinn Spa & Wellness",
    avatar: "KT",
    rating: 5,
    quote: "We got 340 new customers in the first month through referrals alone. The ROI is insane compared to what we paid Groupon.",
  },
  {
    name: "Marcus Lindqvist",
    role: "Co-founder, Nordic Kitchen",
    avatar: "ML",
    rating: 5,
    quote: "Finally a platform that lets us keep our customer data. The analytics show exactly which campaigns actually work.",
  },
  {
    name: "Olena Kovalenko",
    role: "Manager, Kyiv Beauty Studio",
    avatar: "OK",
    rating: 5,
    quote: "Setting up QR redemption took 2 minutes. Our staff loves it — just scan and done. No extra hardware needed.",
  },
  {
    name: "Mikkel Hansen",
    role: "CEO, Oslo Outdoor Adventures",
    avatar: "MH",
    rating: 5,
    quote: "Switched from Groupon and our margins improved by 35%. The flat fee model is so much better for growing businesses.",
  },
];

export function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setCurrent((c) => (c + 1) % TESTIMONIALS.length);

  return (
    <div className="relative max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center px-8"
        >
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: TESTIMONIALS[current].rating }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-[var(--primary)] text-[var(--primary)]" />
            ))}
          </div>
          <blockquote className="text-xl sm:text-2xl font-medium text-[var(--text)] leading-relaxed mb-6">
            &ldquo;{TESTIMONIALS[current].quote}&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-sm font-bold text-white">
              {TESTIMONIALS[current].avatar}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[var(--text)]">{TESTIMONIALS[current].name}</p>
              <p className="text-xs text-[var(--text-muted)]">{TESTIMONIALS[current].role}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 border border-[var(--border)] flex items-center justify-center hover:bg-white transition" aria-label="Previous">
        <ChevronLeft className="h-5 w-5 text-[var(--text)]" />
      </button>
      <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 border border-[var(--border)] flex items-center justify-center hover:bg-white transition" aria-label="Next">
        <ChevronRight className="h-5 w-5 text-[var(--text)]" />
      </button>

      <div className="flex justify-center gap-2 mt-6">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-[var(--primary)] w-6" : "bg-[var(--border)]"}`}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
