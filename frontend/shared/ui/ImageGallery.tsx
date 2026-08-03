import Image from "next/image";

/** Simple photo grid for project / event detail pages. */
export function ImageGallery({
  images,
  title = "Gallery",
}: {
  images: string[];
  title?: string;
}) {
  if (images.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="text-xl font-bold text-ink">
        {title}
        <span className="mt-2 block h-1 w-8 rounded bg-purple" />
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((src, i) => (
          <figure
            key={`${src}-${i}`}
            className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#eee4d6] bg-white shadow-card-sm"
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
