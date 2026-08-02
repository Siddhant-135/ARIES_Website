import { Sidebar } from "@/components/layout/Sidebar";

/** Short ISR window; CMS writes also call revalidatePath for immediate updates. */
export const revalidate = 30;

/**
 * Shared chrome for all inner pages: collapsible left sidebar + content.
 * The landing page (app/page.tsx) and member profiles (app/[slug]) do NOT
 * use this layout on purpose.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
