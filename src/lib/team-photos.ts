import type { TeamYear } from "@/lib/types";

/** Normalize legacy singular `photo` + `photos[]` into a unique URL list. */
export function yearPhotos(year: Pick<TeamYear, "photo" | "photos"> | undefined | null): string[] {
  if (!year) return [];
  const list = [...(year.photos ?? [])];
  if (year.photo && !list.includes(year.photo)) list.unshift(year.photo);
  return list.filter(Boolean);
}

/** Persist photos array; keep `photo` as the first for older readers. */
export function withYearPhotos<T extends TeamYear>(year: T, photos: string[]): T {
  const unique = [...new Set(photos.filter(Boolean))];
  return {
    ...year,
    photo: unique[0],
    photos: unique.length ? unique : undefined,
  };
}
