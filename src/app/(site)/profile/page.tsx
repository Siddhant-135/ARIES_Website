import type { Metadata } from "next";
import { Suspense } from "react";
import { getMembers } from "@/lib/content";
import { ProfileSection } from "@/components/sections/profile/ProfileSection";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const members = await getMembers();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(175deg,#c4b2ee_0%,#b5a0ea_35%,#cabcee_70%,#b9a6ea_100%)]">
      <div className="mx-auto max-w-[1100px] px-6 py-12 md:px-10">
        <h1 className="text-3xl font-black text-[#140b3c]">Your profile</h1>
        <p className="mt-2 text-sm text-[#31217a]/70">
          Edit your photo, name, socials, and sections. Executives need approval for projects and
          events — your own profile saves immediately.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-[#31217a]/70">Loading…</p>}>
            <ProfileSection members={members} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
