import Link from "next/link";
import { ClipboardCheck, House, Radar, Search } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f8f7f2]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-17 w-full max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5"
          aria-label="HouseCheck home"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#173f35] text-white shadow-sm transition-transform group-hover:-rotate-2">
            <House aria-hidden="true" className="size-5" strokeWidth={2.2} />
          </span>
          <span>
            <span className="block text-[17px] font-extrabold tracking-[-0.03em] text-stone-950">
              HouseCheck
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 sm:block">
              Ireland property research
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          <Link className="nav-link" href="/">
            <Search aria-hidden="true" className="size-4" />
            Explore
          </Link>
          <Link className="nav-link" href="/review">
            <ClipboardCheck aria-hidden="true" className="size-4" />
            Review
          </Link>
          <Link className="nav-link" href="/how-it-works">
            <Radar aria-hidden="true" className="size-4" />
            How it works
          </Link>
        </nav>

        <Link
          className="inline-flex items-center gap-2 rounded-full border border-violet-900/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-violet-950 shadow-sm transition hover:bg-white"
          href="/review"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-500 opacity-40" />
            <span className="relative inline-flex size-2 rounded-full bg-violet-600" />
          </span>
          Approval on
        </Link>
      </div>
    </header>
  );
}
