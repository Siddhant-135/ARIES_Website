import { TopNav } from "frontend/pages/landing/TopNav";
import { Hero } from "frontend/pages/landing/Hero";
import { WhatWeDo } from "frontend/pages/landing/WhatWeDo";
import { FaqAndFooter } from "frontend/pages/landing/FaqAndFooter";

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
