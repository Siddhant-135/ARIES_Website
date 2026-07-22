"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";

/** "Send us a message" form. Submission endpoint TBD — currently a stub. */
export function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <form
      className="rounded-2xl bg-white p-7 shadow-card-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-lilac text-purple">
          <MessageSquare size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">Send us a message</h2>
          <p className="text-xs text-ink/60">
            Fill in the details below and we&rsquo;ll get back to you soon.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Your Name" name="name" placeholder="Enter your name" />
        <Field label="Email Address" name="email" type="email" placeholder="you@example.com" />
      </div>
      <Field className="mt-4" label="Subject" name="subject" placeholder="What's this about?" />
      <label className="mt-4 block">
        <span className="text-xs font-semibold text-ink">Message</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Write your message here..."
          className="mt-2 w-full rounded-lg bg-[#f3eef8] px-4 py-3 text-sm text-ink outline-none placeholder-[#9a95b3] focus:ring-2 focus:ring-purple/40"
        />
      </label>

      <button
        type="submit"
        className="mt-6 flex items-center gap-2 rounded-lg bg-purple px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
      >
        Send Message <Send size={15} />
      </button>
      {sent && (
        <p className="mt-4 text-sm font-semibold text-teal">
          Thanks! Message sending isn&rsquo;t wired to a backend yet — we&rsquo;ll
          hook this up soon.
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={className ? `block ${className}` : "block"}>
      <span className="text-xs font-semibold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg bg-[#f3eef8] px-4 py-3 text-sm text-ink outline-none placeholder-[#9a95b3] focus:ring-2 focus:ring-purple/40"
      />
    </label>
  );
}
