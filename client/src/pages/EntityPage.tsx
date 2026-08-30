import { ArrowLeft, CalendarDays, CircleAlert, Radio, Share2 } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { DateNavigator } from "@/components/DateNavigator";
import { MatchCard } from "@/components/MatchCard";
import { ShareExportActions } from "@/components/ShareExportActions";
import { useFootyScores } from "@/hooks/useFootyScores";
import { useMemo } from "react";

export default function EntityPage() {
  const [, teamParams] = useRoute("/team/:teamId");
  const [, competitionParams] = useRoute("/competition/:slug");
  const [, navigate] = useLocation();
  const scoreDesk = useFootyScores();
  const isTeam = Boolean(teamParams);
  const entityId = decodeURIComponent((teamParams?.teamId || competitionParams?.slug || "").trim());
  const entity = useMemo(() => {
    if (isTeam) {
      const match = scoreDesk.data.matches.find((item) => item.home.id === entityId || item.away.id === entityId || item.home.name === entityId || item.away.name === entityId);
      return { name: match?.home.id === entityId || match?.home.name === entityId ? match.home.name : match?.away.name || entityId, region: "Team desk" };
    }
    const competition = scoreDesk.directory.find((item) => item.slug === entityId) || scoreDesk.data.matches.find((item) => item.competition.slug === entityId)?.competition;
    return { name: competition?.name || entityId, region: competition?.region || "Competition desk" };
  }, [entityId, isTeam, scoreDesk.data.matches, scoreDesk.directory]);
  const matches = useMemo(() => scoreDesk.data.matches.filter((match) => isTeam ? match.home.id === entityId || match.away.id === entityId || match.home.name === entityId || match.away.name === entityId : match.competition.slug === entityId), [entityId, isTeam, scoreDesk.data.matches]);
  const share = async () => {
    const url = window.location.href;
    const title = `${entity.name} · FootyScores Pro`;
    if (navigator.share) await navigator.share({ title, text: `Follow ${entity.name} on FootyScores Pro`, url });
    else await navigator.clipboard?.writeText(url);
  };

  return (
    <main className="match-center-page entity-page">
      <header className="match-center-header">
        <Link href="/" asChild><Button variant="ghost" aria-label="Back to matchday"><ArrowLeft size={17} /> <span>Matchday</span></Button></Link>
        <div className="match-center-header__brand"><span className="brand__wordmark"><strong>FOOTY</strong><b>SCORES</b><em>PRO</em></span></div>
        <Button variant="outline" onClick={() => void share()} aria-label={`Share ${entity.name}`}><Share2 size={16} /> <span>Share</span></Button>
      </header>
      <section className="match-center-shell">
        <div className="match-center-kicker"><Radio size={14} /> {isTeam ? "Team desk" : "Competition desk"} <span>CAT · Live ESPN data</span></div>
        <div className="entity-page__intro">
          <div><p className="eyebrow">{entity.region}</p><h1>{entity.name}</h1><p>{matches.length} match{matches.length === 1 ? "" : "es"} on the selected matchday</p></div>
          <div className="entity-page__actions"><Button variant="outline" onClick={() => void share()}><Share2 size={16} /> Share</Button><Link href="/" asChild><Button><CalendarDays size={16} /> Matchday</Button></Link></div>
        </div>
        <ShareExportActions title={`${entity.name} · FootyScores Pro`} filename={`${entity.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-matches.txt`} text={matches.map((match) => `${match.home.name} ${match.home.score ?? "-"}–${match.away.score ?? "-"} ${match.away.name}`).join("\n")} compact />
        <DateNavigator value={scoreDesk.dateKey} onChange={scoreDesk.setDateKey} compact />
        {scoreDesk.data.isLoading ? <div className="match-center-loading">Loading {entity.name}…</div> : matches.length ? <div className="entity-page__matches">{matches.map((match) => <MatchCard key={match.id} match={match} settings={scoreDesk.settings} />)}</div> : <div className="match-center-empty"><CircleAlert size={28} /><h2>No matches in this view</h2><p>Try another matchday or add this competition to your desk.</p><Link href="/" asChild><Button><ArrowLeft size={16} /> Return to Matchday</Button></Link></div>}
      </section>
    </main>
  );
}

