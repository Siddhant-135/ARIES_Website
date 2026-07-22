import { Eyebrow } from "./Eyebrow";

/** Inner-page header: eyebrow label + big heading + optional subtitle. */
export function PageHero({
  eyebrow,
  title,
  accent,
  titleSuffix,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  /** italic purple word(s), rendered after `title` */
  accent?: string;
  /** plain text rendered after the accent */
  titleSuffix?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="pt-14">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.05] text-[#081634] md:text-[54px]">
        {title}
        {accent && (
          <>
            {" "}
            <em className="italic text-[#7160cb]">{accent}</em>
          </>
        )}
        {titleSuffix && ` ${titleSuffix}`}
      </h1>
      {subtitle && (
        <p className="mt-6 max-w-md text-sm leading-6 text-[#384153] md:text-[15px]">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
