import { cn } from "@/lib/utils";
import { colors } from "@/config/colors";

/**
 * Colored category chip (project/resource cards).
 * Palette lives in `src/config/colors.ts` — add categories there.
 */
const { chip } = colors;

const palette: Record<string, { bg: string; fg: string }> = {
  hackathon: chip.teal,
  "industry project": chip.orange,
  publication: chip.purple,
  research: chip.blue,
  "ai / ml": chip.purple,
  tool: chip.teal,
  book: chip.orange,
  course: chip.purple,
  tutorial: chip.blue,
  dataset: chip.rose,
  talk: chip.purple,
  workshop: chip.teal,
  event: chip.blue,
};

export function CategoryBadge({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const c = palette[children.toLowerCase()] ?? chip.neutral;
  return (
    <span
      className={cn(
        "inline-block rounded-[5px] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider",
        className,
      )}
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}
