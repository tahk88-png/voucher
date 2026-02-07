// Backend-integrated version - kept for reference
// This file conflicts with app/(landing)/page.tsx
// The UI skeleton landing page is at app/(landing)/page.tsx

import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-4xl font-bold text-[#2D2721]">
          Turn your best customers into your best salespeople and only pay when it actually works.
        </h1>
        <p className="text-lg text-[#6B5744]">Pay for results, not reach.</p>
        <div className="flex gap-4 justify-center">
          <WarmButton asChild>
            <Link href="/login">Get Started</Link>
          </WarmButton>
        </div>
      </div>
    </div>
  );
}
