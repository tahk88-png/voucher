import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('et-EE', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('et-EE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="flex items-center gap-3 bg-[#FFF9ED] px-4 py-2 rounded-xl border border-[#E7DCC7] text-[#2D2721] shadow-sm">
      <div className="flex flex-col items-end leading-none">
        <span className="font-bold text-lg font-mono">{formatTime(time)}</span>
        <span className="text-[10px] uppercase font-bold text-[#8B7355] tracking-wider">{formatDate(time)}</span>
      </div>
      <Clock className="w-5 h-5 text-[#E17B5C]" />
    </div>
  );
}