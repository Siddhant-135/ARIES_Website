import Image from "next/image";
import Link from "next/link";

/**
 * Landing frame 1 — full first viewport. Artwork fills 100svh/100dvh with
 * no cream bleed underneath. Night fallback behind the image so empty
 * letterboxing (if any) stays brand-dark, never peach.
 */
export function Hero() {
  return (
    <section className="landing-frame overflow-hidden bg-night">
      <Image
        src="/images/landing/hero-mountains.png"
        alt="Mountains at sunrise with a deer overlooking a city — ARIES artwork"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_40%] md:object-[70%_center]"
      />
      {/* Soft left wash for text on small screens only */}
      <div className="absolute inset-0 bg-gradient-to-r from-cream/75 via-cream/20 to-transparent md:from-transparent" />

      <div className="relative z-10 mx-auto flex h-full min-h-[100svh] min-h-[100dvh] max-w-[1480px] flex-col justify-center px-6 pb-20 pt-28 md:px-10 md:pb-16 md:pt-24">
        <p className="text-sm font-normal tracking-[0.07em] text-navy md:text-[15px]">
          Official AI &amp; ML Club of IIT Delhi
        </p>
        <h1 className="mt-4 max-w-xl text-5xl font-bold leading-[1.07] tracking-tight text-navy md:text-7xl">
          Building the Future with AI.
        </h1>
        <p className="mt-5 text-lg font-medium text-navy md:text-[21px]">
          Research. Build. Deploy. Impact.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/events"
            className="rounded-full bg-navy px-7 py-3 text-sm font-bold text-white shadow-cta transition-transform hover:scale-105"
          >
            Explore Events →
          </Link>
          <Link
            href="/projects"
            className="rounded-full border border-navy bg-white/35 px-7 py-3 text-sm font-bold text-navy backdrop-blur-sm transition-colors hover:bg-white/60"
          >
            View Projects
          </Link>
        </div>
      </div>
    </section>
  );
}
