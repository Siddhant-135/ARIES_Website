import Image from "next/image";

/**
 * Minimal mountain footer — full low-poly artwork, two end-aligned lines.
 * Landing embeds the same treatment inside FaqAndFooter.
 */
export function SiteFooter() {
  return (
    <footer className="relative aspect-[672/384] w-full min-h-[200px] max-h-[420px] overflow-hidden bg-[#3a2d78]">
      <Image
        src="/images/landing/footer-overlay.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#2a1f5c]/45 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 px-6 pb-5 md:px-12 md:pb-6">
        <p className="text-xs font-semibold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(20,10,60,0.65)] md:text-sm">
          © 2026 ARIES, IIT Delhi
        </p>
        <p className="font-mono text-xs font-semibold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(20,10,60,0.65)] md:text-sm">
          while(alive)&nbsp;learn();
        </p>
      </div>
    </footer>
  );
}
