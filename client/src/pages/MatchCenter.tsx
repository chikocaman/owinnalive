import { ArrowLeft, CalendarDays, CircleAlert, Radio, Share2 } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/MatchCard";
import { useFootyScores } from "@/hooks/useFootyScores";

export default function MatchCenter() {
  const [, params] = useRoute("/match/:matchId");
  const [, navigate] = useLocation();
  const scoreDesk = useFootyScores();
  const match = scoreDesk.data.matches.find((item) => item.id === params?.matchId);

  return (
    <main className="match-center-page">
      <header className="match-center-header">
        <Link href="/" asChild><Button variant="ghost" aria-label="Back to matchday">
          <ArrowLeft size={17} /> <span>Matchday</span>
        </Button></Link>
        <div className="match-center-header__brand"><span className="brand__wordmark"><strong>FOOTY</strong><b>SCORES</b><em>PRO</em></span></div>
        <Button variant="outline" onClick={() => void navigator.share?.({ title: match ? `${match.home.name} v ${match.away.name}` : "FootyScores Pro", url: window.location.href })} aria-label="Share match">
          <Share2 size={16} /> <span>Share</span>
        </Button>
      </header>

      <section className="match-center-shell">
        <div className="match-center-kicker"><Radio size={14} /> Match center <span>CAT · Live ESPN data</span></div>
        {scoreDesk.data.isLoading ? (
          <div className="match-center-loading">Loading match center…</div>
        ) : match ? (
          <>
            <div className="match-center-intro">
              <div><p className="eyebrow">{match.competition.region}</p><h1>{match.home.name} <span>v</span> {match.away.name}</h1><p>{match.competition.name} · {match.kickoff} CAT · {match.venue || "Venue not listed"}</p></div>
              <Button variant="outline" onClick={() => { scoreDesk.setDateKey(match.date); navigate("/"); }}><CalendarDays size={16} /> Matchday</Button>
            </div>
            <MatchCard match={match} settings={scoreDesk.settings} />
          </>
        ) : (
          <div className="match-center-empty"><CircleAlert size={28} /><h1>Match unavailable</h1><p>ESPN no longer has this fixture in the current matchday window.</p><Link href="/" asChild><Button><ArrowLeft size={16} /> Return to Matchday</Button></Link></div>
        )}
      </section>
    </main>
  );
}
