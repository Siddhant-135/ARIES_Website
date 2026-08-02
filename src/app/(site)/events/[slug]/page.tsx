import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, CalendarPlus, ArrowLeft } from "lucide-react";
import { getEvent, getEvents } from "@/lib/content";

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const d = new Date(event.date + "T00:00:00");
  const today = new Date().toISOString().slice(0, 10);
  const isPast = event.date < today;
  const dateLabel = d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f6f1fb_0%,#ece2f7_55%,#e0d2f3_100%)]">
      <div className="glow-circle absolute -right-24 top-40 size-96" />
      <div className="relative mx-auto max-w-[1000px] px-6 pb-20 pt-14 md:px-10">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-semibold text-purple hover:underline"
        >
          <ArrowLeft size={15} /> All events
        </Link>

        <h1 className="mt-6 text-4xl font-bold text-[#2b1e6b] md:text-5xl">
          {event.title}
        </h1>

        {/* Meta row — time/venue only for upcoming */}
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink">
          <span className="flex items-center gap-2">
            <CalendarDays size={16} className="text-purple" /> {dateLabel}
          </span>
          {!isPast && event.startTime && (
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-purple" />
              {event.startTime}
              {event.endTime && ` – ${event.endTime}`}
            </span>
          )}
          {!isPast && event.venue && (
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-purple" /> {event.venue}
            </span>
          )}
          <span className="rounded-full bg-white/70 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#5b4eb5]">
            {event.type}
          </span>
        </div>

        {/* Media */}
        {(event.image || event.video) && (
          <div className="mt-8 space-y-4">
            {event.image && (
              <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-[#d9d9d9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.image} alt="" className="size-full object-cover" />
              </div>
            )}
            {event.video && (
              <video
                src={event.video}
                controls
                playsInline
                className="aspect-video w-full overflow-hidden rounded-2xl bg-black"
              />
            )}
          </div>
        )}
        {!event.image && !event.video && (
          <div className="mt-8 grid aspect-[21/9] w-full place-items-center rounded-2xl bg-[#d9d9d9] text-sm text-[#7d7d7d]">
            Event photo coming soon
          </div>
        )}

        {/* Body */}
        <div className="mt-8 max-w-3xl space-y-5 text-[17px] leading-8 text-[#1c1633]">
          {(event.body ?? event.description).split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Calendar CTA */}
        {event.links.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-3">
            {event.links.map((l) => (
              <a
                key={l.label}
                href={l.url}
                className="flex items-center gap-2 rounded-full bg-navy-2 px-6 py-3 text-sm font-bold text-white shadow-cta transition-transform hover:scale-105"
              >
                <CalendarPlus size={16} /> {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
