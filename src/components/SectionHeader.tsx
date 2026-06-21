import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  title: string;
  href?: string;
  subtitle?: string;
}

export default function SectionHeader({ title, href, subtitle }: Props) {
  return (
    <div className="flex items-end justify-between mb-6 gap-4">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group flex items-center gap-1 text-sm font-medium shrink-0 transition-opacity hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          View all
          <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
