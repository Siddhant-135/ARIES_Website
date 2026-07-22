import { TopNav } from "@/components/layout/TopNav";
import { Hero } from "@/components/sections/landing/Hero";
import { WhatWeDo } from "@/components/sections/landing/WhatWeDo";
import { FaqAndFooter } from "@/components/sections/landing/FaqAndFooter";

/**
 * Landing — three full-viewport frames:
 *  1. Hero (artwork fills the first screen)
 *  2. What we do + achievement numbers
 *  3. FAQ + footer (one continuous mist→night block)
 */
export default function LandingPage() {
  return (
    <div className="relative bg-night">
      <TopNav />
      <Hero />
      <WhatWeDo />
      <FaqAndFooter />
    </div>
  );
}
