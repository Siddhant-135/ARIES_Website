import { revalidatePath } from "next/cache";

/** Bust ISR cache after CMS writes so /projects, /events, etc. show new data. */
export function revalidateContent(kind?: string, slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/(site)", "layout");

  if (!kind || kind === "projects" || kind === "project") {
    revalidatePath("/projects");
    if (slug) revalidatePath(`/projects/${slug}`);
  }
  if (!kind || kind === "events" || kind === "event") {
    revalidatePath("/events");
    if (slug) revalidatePath(`/events/${slug}`);
  }
  if (!kind || kind === "members" || kind === "member") {
    revalidatePath("/team");
    if (slug) revalidatePath(`/${slug}`);
  }
  if (!kind || kind === "team") {
    revalidatePath("/team");
  }
}
