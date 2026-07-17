import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-[#f1f0e9]">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-4 py-8 text-sm text-stone-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="font-bold text-stone-900">HouseCheck</p>
          <p>Property data should be verified with the agent and legal documents.</p>
        </div>
        <div className="flex items-center gap-5">
          <Link className="font-semibold hover:text-stone-950" href="/how-it-works">
            Data method
          </Link>
          <a
            className="font-semibold hover:text-stone-950"
            href="https://www.openstreetmap.org/copyright"
            rel="noreferrer"
            target="_blank"
          >
            OpenStreetMap attribution
          </a>
        </div>
      </div>
    </footer>
  );
}
