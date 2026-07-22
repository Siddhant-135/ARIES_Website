import type { Metadata } from "next";
import { Mail, MapPin, ExternalLink } from "lucide-react";
import { clubSocials, clubEmail, clubLocation } from "@/config/socials";
import { ContactForm } from "@/components/sections/contact/ContactForm";

export const metadata: Metadata = { title: "Contact" };

/** Brand glyphs (lucide dropped brand icons) — simple monogram tiles. */
const socialGlyphs: Record<string, string> = {
  LinkedIn: "in",
  GitHub: "gh",
  Kaggle: "k",
  Instagram: "ig",
  LeetCode: "lc",
  "Twitter / X": "𝕏",
  Email: "@",
  Medium: "M",
};

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fbf4ec]">
      {/* soft background shapes */}
      <div className="absolute -right-20 -top-16 size-72 rounded-full bg-[#e4dcf7]" />
      <div className="absolute right-40 top-28 size-40 rounded-full bg-[#f3e7d3]" />

      <div className="relative mx-auto max-w-[1240px] px-6 pb-20 pt-14 md:px-12">
        <h1 className="text-5xl font-black leading-[1.1] text-ink">
          Let&rsquo;s
          <br />
          <span className="text-purple underline decoration-purple/50 decoration-4 underline-offset-8">
            Connect!
          </span>
        </h1>
        <p className="mt-6 max-w-md text-sm leading-6 text-ink/70">
          We&rsquo;d love to hear from you. Reach out for collaborations,
          opportunities or any queries.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <ContactForm />

          {/* Get in touch card */}
          <aside className="rounded-2xl bg-white p-7 shadow-card-sm">
            <h2 className="text-lg font-bold text-ink">Get in touch</h2>
            <p className="mt-2 text-xs text-ink/60">
              We&rsquo;re always happy to connect and explore new ideas together.
            </p>
            <div className="mt-8 space-y-6">
              <p className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-lilac text-purple">
                  <Mail size={17} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">Email</span>
                  <a href={`mailto:${clubEmail}`} className="text-sm text-ink/70 hover:text-purple">
                    {clubEmail}
                  </a>
                </span>
              </p>
              <p className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-lilac text-purple">
                  <MapPin size={17} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">Location</span>
                  <span className="text-sm text-ink/70">{clubLocation}</span>
                </span>
              </p>
            </div>
            <hr className="my-8 border-[#f0e8dc]" />
            <p className="text-center text-sm italic text-ink/60">
              ✨ Great things happen when we collaborate.
            </p>
          </aside>
        </div>

        {/* Social tiles */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {clubSocials.map((s) => {
            const glyph = socialGlyphs[s.label] ?? "↗";
            return (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card-sm transition-transform hover:-translate-y-1"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lilac text-lg font-black text-purple">
                  {glyph}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">{s.label}</span>
                  <span className="block truncate text-xs text-ink/60">{s.handle}</span>
                </span>
                <ExternalLink
                  size={14}
                  className="ml-auto shrink-0 text-ink/30 group-hover:text-purple"
                />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
