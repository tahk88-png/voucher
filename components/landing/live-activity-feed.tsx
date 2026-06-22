"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag } from "lucide-react";

const ACTIVITIES = [
  { name: "Maria K.", city: "Tallinn", item: "Spa Weekend Pass", time: "2 min ago" },
  { name: "Jaan T.", city: "Tartu", item: "Restaurant Gift Card", time: "5 min ago" },
  { name: "Liisa M.", city: "Helsinki", item: "Fashion Voucher 30%", time: "8 min ago" },
  { name: "Anders S.", city: "Stockholm", item: "Tech Store Credit", time: "12 min ago" },
  { name: "Olena P.", city: "Kyiv", item: "Beauty Box Voucher", time: "15 min ago" },
  { name: "Mikkel R.", city: "Oslo", item: "Fitness Monthly Pass", time: "18 min ago" },
  { name: "Katrin V.", city: "Pärnu", item: "Coffee Shop Bundle", time: "22 min ago" },
  { name: "Erik L.", city: "Gothenburg", item: "Concert Tickets 2x", time: "25 min ago" },
];

export function LiveActivityFeed() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Initial delay
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 3000);

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % ACTIVITIES.length);
        setVisible(true);
      }, 500);
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const activity = ACTIVITIES[current];

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden md:block">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-center gap-3 bg-white/95 backdrop-blur-md border border-[var(--border)] rounded-xl px-4 py-3 shadow-lg max-w-xs"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text)] truncate">
                {activity.name} <span className="font-normal text-[var(--text-faint)]">from {activity.city}</span>
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">purchased {activity.item}</p>
              <p className="text-[10px] text-[var(--text-faint)]">{activity.time}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
