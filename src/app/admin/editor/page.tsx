import type { Metadata } from "next";
import { getMembers } from "@/lib/content";
import { AdminTabs } from "@/components/admin/AdminTabs";

export const metadata: Metadata = { title: "Editor" };

/**
 * Admin editor. Until auth exists, it edits the first member on file.
 * When login is real, resolve the member from the session instead.
 */
export default function AdminEditorPage() {
  const member = getMembers()[0];

  return (
    <div className="min-h-screen bg-[#f4eff9]">
      <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10">
        <h1 className="text-2xl font-black text-ink">Member editor</h1>
        <p className="mt-2 text-sm text-ink/60">
          Changes save to the content files powering the site. Refresh your
          profile page to see them live.
        </p>
        <div className="mt-8">
          <AdminTabs member={member} />
        </div>
      </div>
    </div>
  );
}
