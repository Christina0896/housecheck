import { CircleCheck, FileText, MapPin } from "lucide-react";
import type { EvidenceLevel } from "@/lib/types";

const evidenceContent: Record<
  EvidenceLevel,
  { label: string; className: string; icon: typeof CircleCheck }
> = {
  "map-verified": {
    label: "Map checked",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
    icon: MapPin,
  },
  "agent-stated": {
    label: "Agent stated",
    className: "bg-amber-50 text-amber-900 ring-amber-700/15",
    icon: FileText,
  },
  estimated: {
    label: "Estimated",
    className: "bg-slate-100 text-slate-700 ring-slate-600/10",
    icon: CircleCheck,
  },
};

export function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  const content = evidenceContent[level];
  const Icon = content.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${content.className}`}
    >
      <Icon aria-hidden="true" className="size-3" />
      {content.label}
    </span>
  );
}
