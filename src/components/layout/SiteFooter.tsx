import Image from "next/image";
import Link from "next/link";
import { footerNav } from "@/config/nav";

/**
 * Standalone footer (non-landing pages if needed).
 * Landing uses the integrated version inside FaqAndFooter.
 * Mountain art is the surface — no flat navy band under a separate overlay.
 */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden text-white">
      <Image
        src="/images/landing/footer-mountains.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-bottom"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/85 to-night/95" />

      <div className="relative mx-auto grid max-w-[1400px] gap-10 px-6 py-14 md:grid-cols-[1.2fr_1fr_1fr_1fr_1.4fr] lg:px-12">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/images/brand/logo-white.svg"
              alt=""
              width={44}
              height={52}
              className="h-12 w-auto"
            />
            <span className="leading-none">
              <span className="block text-lg font-black tracking-[0.35em]">ARIES</span>
              <span className="mt-1 block text-xs font-black tracking-[0.28em]">
                IIT DELHI
              </span>
            </span>
          </div>
          <p className="mt-6 max-w-64 text-[15px] leading-7 text-white/90">
            Building AI beyond the classroom. Together, we learn, build and
            create impact.
          </p>
        </div>

        <FooterCol title="Navigate" links={footerNav.navigate} />
        <FooterCol title="Connect" links={footerNav.connect} />
        <FooterCol title="Legal" links={footerNav.legal} />

        <div>
          <h3 className="text-base font-bold">Stay in the loop</h3>
          <p className="mt-4 text-[15px] leading-7 text-white/90">
            Get updates on events, projects and opportunities.
          </p>
          <form
            className="mt-6 flex items-center rounded-full border border-white/90 bg-night/30 p-1 pl-5 backdrop-blur-sm"
            action="#"
          >
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="w-full bg-transparent text-sm text-white placeholder-white/70 outline-none"
            />
            <button
              aria-label="Subscribe"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple-3 to-purple-2 text-xl"
            >
              →
            </button>
          </form>
        </div>
      </div>

      <p className="relative pb-8 text-center text-sm text-white/85">
        © 2026 Aries, IIT Delhi. All rights reserved.
      </p>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-base font-bold">{title}</h3>
      <ul className="mt-5 space-y-4">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[15px] text-white/90 transition-colors hover:text-purple-3"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
