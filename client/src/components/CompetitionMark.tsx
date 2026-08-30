import { useEffect, useMemo, useState } from "react";
import type { Competition } from "@/lib/types";

export function competitionInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "FC";
}

function accentFor(slug: string) {
  let hash = 0;
  for (const character of slug) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  const accents = ["#102a43", "#315c78", "#8a4a3d", "#536b4e", "#73577a", "#8a6a35"];
  return accents[Math.abs(hash) % accents.length];
}

export function competitionMarkPresentation(competition: Competition, imageFailed = false) {
  return {
    showImage: Boolean(competition.logo && !imageFailed),
    initials: competitionInitials(competition.name),
    background: accentFor(competition.slug),
  };
}

export function CompetitionMark({ competition, className = "" }: { competition: Competition; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [competition.logo, competition.slug]);
  const presentation = useMemo(() => competitionMarkPresentation(competition, failed), [competition, failed]);

  if (presentation.showImage) {
    return <img className={className} src={competition.logo} alt={`${competition.name} logo`} onError={() => setFailed(true)} />;
  }

  return <span className={`${className} competition-mark__fallback`} style={{ background: presentation.background }} aria-label={`${competition.name} mark`}>{presentation.initials}</span>;
}
