import { ArrowLeft, CalendarDays, Radio, Star } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DateNavigator } from "@/components/DateNavigator";
import { MatchCard } from "@/components/MatchCard";
import { useFootyScores } from "@/hooks/useFootyScores";
import { selectMyDeskMatches } from "@/lib/my-desk-utils";
import { useMemo } from "react";

export default function MyDesk() {
  const [, navigate] = useLocation();
  const scoreDesk = useFootyScores();
  const matches = useMemo(() => selectMyDeskMatches(scoreDesk.data.matches, scoreDesk.settings.pinnedTeamIds, scoreDesk.settings.selectedSlugs), [scoreDesk.data.matches, scoreDesk.settings.pinnedTeamIds, scoreDesk.settings.selectedSlugs]);
  const pinnedTeams = useMemo(() => Array.from(new Map(scoreDesk.data.matches.flatMap((match) => [match.home, match.away]).filter((team) => team.id && scoreDesk.settings.pinnedTeamIds.includes(team.id)).map((team) => [team.id, team])).values()), [scoreDesk.data.matches, scoreDesk.settings.pinnedTeamIds]);
  const pinnedCompetitions = scoreDesk.directory.filter((competition) => scoreDesk.settings.selectedSlugs.includes(competition.slug));
  return (
    <main className="match-center-page my-desk-page">
      <header className="match-center-header">
        <Link href="/" asChild><Button variant="ghost"><ArrowLeft size={17} /> <span>Matchday</span></Button></Link>
        <div className="match-center-header__brand"><span className="brand__wordmark"><strong>FOOTY</strong><b>SCORES</b><em>PRO</em></span></div>
        <Link href="/" asChild><Button variant="outline"><CalendarDays size={16} /> <span>All matches</span></Button></Link>
      </header>
      <section className="match-center-shell">
        <div className="match-center-kicker"><Radio size={14} /> My Desk <span>CAT · Your selected football</span></div>
        <div className="entity-page__intro"><div><p className="eyebrow">Personal workspace</p><h1>My Desk</h1><p>{matches.length} selected match{matches.length === 1 ? "" : "es"} on this matchday</p></div><Link href="/" asChild><Button><Star size={16} /> Manage pins</Button></Link></div>
        <DateNavigator value={scoreDesk.dateKey} onChange={scoreDesk.setDateKey} compact />
        {(pinnedTeams.length > 0 || pinnedCompetitions.length > 0) && <div className="my-desk-links"><div><p className="eyebrow">Pinned teams</p>{pinnedTeams.length ? pinnedTeams.map((team) => <Link key={team.id} href={`/team/${encodeURIComponent(team.id || team.name)}`} asChild><Button variant="outline" size="sm">{team.name}</Button></Link>) : <span className="settings-muted">No teams pinned yet.</span>}</div><div><p className="eyebrow">Selected competitions</p>{pinnedCompetitions.length ? pinnedCompetitions.map((competition) => <Link key={competition.slug} href={`/competition/${encodeURIComponent(competition.slug)}`} asChild><Button variant="outline" size="sm">{competition.name}</Button></Link>) : <span className="settings-muted">No competition shortcuts yet.</span>}</div></div>}
        {scoreDesk.data.isLoading ? <div className="match-center-loading">Loading My Desk…</div> : matches.length ? <div className="entity-page__matches">{matches.map((match) => <MatchCard key={match.id} match={match} settings={scoreDesk.settings} />)}</div> : <div className="match-center-empty"><Star size={28} /><h2>Build your desk</h2><p>Pin teams or select competitions in Settings to make this view yours.</p><Link href="/" asChild><Button><ArrowLeft size={16} /> Go to Matchday</Button></Link></div>}
      </section>
    </main>
  );
}
