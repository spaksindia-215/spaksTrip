import Link from "next/link";
import { cn } from "@/lib/cn";

type LogoProps = {
  variant?: "header" | "footer";
  className?: string;
};

const LOGO_STYLES = {
  header: {
    link: "shrink-0",
    frame:
      "flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-transparent p-1.5 shadow-sm ",
    image: "h-full w-full object-contain",
  },
  footer: {
    link: "shrink-0",
    frame:
      "flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] bg-transparent p-2 shadow-[0_px_40px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/80",
    image: "h-full w-full object-contain",
  },
} as const;

export default function Logo({ variant = "footer", className }: LogoProps) {
  const styles = LOGO_STYLES[variant];

  return (
  <Link
    href="/"
    aria-label="Spakstrip home"
    className={cn(styles.link, className)}
  >
    <div className={styles.frame}>
      <img
        src="/logo.png"
        alt="Spakstrip logo"
        className={styles.image}
      />
    </div>
  </Link>
);
}

