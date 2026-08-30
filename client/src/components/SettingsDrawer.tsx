/**
 * FootyScores Pro — Matchday Ledger component.
 * A focused control drawer for copy syntax, style preferences, and the personal competition desk.
 */

import { useMemo, useState } from "react";
import { Bell, Settings2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AppSettings, Competition, NotificationEventType, OutputStyle } from "@/lib/types";
import { CompetitionBrowser } from "@/components/CompetitionBrowser";
import type { PushStatus } from "@/lib/push-client";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  browseOpen: boolean;
  onBrowseOpen: (open: boolean) => void;
  settings: AppSettings;
  directory: Competition[];
  directoryLoading: boolean;
  directoryError: string | null;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onToggleCompetition: (slug: string) => void;
  onTogglePinnedTeam?: (teamId: string) => void;
  availableTeams?: Array<{ id: string; name: string }>;
  pushStatus?: PushStatus;
  onPushToggle?: (enabled: boolean) => void;
  onPushTest?: () => void;
}

const NOTIFICATION_EVENTS: Array<{ key: NotificationEventType; label: string }> = [
  { key: "goal", label: "Goals" },
  { key: "kickoff", label: "Kickoffs" },
  { key: "full-time", label: "Full time" },
  { key: "aet", label: "AET" },
  { key: "penalties", label: "Penalties" },
  { key: "red-card", label: "Red cards" },
];

export function SettingsDrawer({ open, onClose, browseOpen, onBrowseOpen, settings, directory, directoryLoading, directoryError, onUpdate, onToggleCompetition, onTogglePinnedTeam, availableTeams = [], pushStatus = "default", onPushToggle, onPushTest }: SettingsDrawerProps) {
  const [teamQuery, setTeamQuery] = useState("");
  const [competitionQuery, setCompetitionQuery] = useState("");
  const teams = useMemo(() => availableTeams.filter((team) => team.name.toLocaleLowerCase().includes(teamQuery.toLocaleLowerCase())).slice(0, 12), [availableTeams, teamQuery]);
  const notificationCompetitions = useMemo(() => directory.filter((competition) => competition.name.toLocaleLowerCase().includes(competitionQuery.toLocaleLowerCase()) || competition.slug.toLocaleLowerCase().includes(competitionQuery.toLocaleLowerCase())).slice(0, 18), [directory, competitionQuery]);
  const updateNotifications = (patch: Partial<AppSettings["notifications"]>) => onUpdate({ notifications: { ...settings.notifications, ...patch } });
  const toggleNotificationEvent = (eventType: NotificationEventType) => updateNotifications({ eventTypes: settings.notifications.eventTypes.includes(eventType) ? settings.notifications.eventTypes.filter((item) => item !== eventType) : [...settings.notifications.eventTypes, eventType] });
  const toggleNotificationTeam = (teamId: string) => updateNotifications({ teamIds: settings.notifications.teamIds.includes(teamId) ? settings.notifications.teamIds.filter((item) => item !== teamId) : [...settings.notifications.teamIds, teamId] });
  const toggleNotificationCompetition = (slug: string) => updateNotifications({ competitionSlugs: settings.notifications.competitionSlugs.includes(slug) ? settings.notifications.competitionSlugs.filter((item) => item !== slug) : [...settings.notifications.competitionSlugs, slug] });
  if (!open) return null;
  return (
    <div className="drawer-layer" role="presentation">
      <button type="button" className="drawer-layer__backdrop" onClick={onClose} aria-label="Close settings" />
      <aside className="settings-drawer" aria-label="FootyScores Pro settings">
        <header className="drawer-header">
          <div className="drawer-header__mark"><Settings2 size={18} /></div>
          <div><p className="eyebrow">Personal desk</p><h2>Settings</h2></div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close settings"><X size={18} /></button>
        </header>

        <div className="settings-drawer__body">
          <section className="settings-group">
            <div className="settings-group__title"><p className="eyebrow">Update syntax</p><span>Saved automatically</span></div>
            <label className="settings-input"><span>Line prefix</span><input value={settings.prefix} maxLength={8} onChange={(event) => onUpdate({ prefix: event.target.value || "$" })} /></label>
            <div className="settings-preview"><code>{settings.prefix || "$"} home goal [1] by “Player” at 75'</code></div>
          </section>

          <section className="settings-group">
            <div className="settings-group__title"><p className="eyebrow">Output style</p></div>
            <div className="segmented-control" role="group" aria-label="Default output style">
              {(["line", "combined"] as OutputStyle[]).map((style) => <button key={style} type="button" onClick={() => onUpdate({ outputStyle: style })} className={cn(settings.outputStyle === style && "segmented-control__active")}>{style === "line" ? "Line by line" : "Combined"}</button>)}
            </div>
            <div className="switch-row"><div><b>Goal credits</b><span>Add [via P] and [via OG] when available</span></div><Switch checked={settings.viaCredits} onCheckedChange={(viaCredits) => onUpdate({ viaCredits })} /></div>
          </section>

          <section className="settings-group settings-group--my-desk">
            <div className="settings-group__title"><p className="eyebrow">My Desk</p><span>{settings.pinnedTeamIds.length} teams pinned</span></div>
            <p className="settings-copy">Keep favorite teams close without changing the competitions loaded on Matchday.</p>
            <div className="segmented-control" role="group" aria-label="Display timezone">
              {(["cat", "local"] as const).map((timezone) => <button key={timezone} type="button" onClick={() => onUpdate({ displayTimezone: timezone })} className={cn(settings.displayTimezone === timezone && "segmented-control__active")}>{timezone === "cat" ? "CAT · UTC+2" : "My local time"}</button>)}
            </div>
            <div className="notification-team-list">
              {teams.length ? teams.map((team) => <button type="button" key={`desk-${team.id}`} className={cn("notification-team", settings.pinnedTeamIds.includes(team.id) && "notification-team--selected")} onClick={() => onTogglePinnedTeam?.(team.id)}><span>{team.name}</span><b>{settings.pinnedTeamIds.includes(team.id) ? "Pinned" : "Pin"}</b></button>) : <span className="settings-muted">Load a matchday to discover teams for My Desk.</span>}
            </div>
          </section>

          <section className="settings-group settings-group--competitions">
            <div className="settings-group__title"><p className="eyebrow">Competition desk</p><span>{settings.selectedSlugs.length} selected</span></div>
            <p className="settings-copy">Choose the competitions that should load on your matchdesk. Each selection applies instantly.</p>
            <Button className="browse-button" onClick={() => onBrowseOpen(true)}><SlidersHorizontal size={16} /> Browse competitions</Button>
            <div className="selected-list">
              {settings.selectedSlugs.slice(0, 8).map((slug) => {
                const competition = directory.find((item) => item.slug === slug);
                return <button key={slug} type="button" onClick={() => onToggleCompetition(slug)} className="selected-list__item"><span>{competition?.name || slug}</span><X size={14} /></button>;
              })}
              {settings.selectedSlugs.length > 8 && <span className="selected-list__more">+{settings.selectedSlugs.length - 8} more selected</span>}
            </div>
          </section>

          <section className="settings-group settings-group--notifications">
            <div className="settings-group__title"><p className="eyebrow"><Bell size={13} /> Push notifications</p><span>{settings.notifications.enabled ? "Opted in" : "Paused"}</span></div>
            <p className="settings-copy">Only selected competitions and teams can send alerts. Your desk selections stay separate.</p>
            <div className="switch-row"><div><b>Enable background alerts</b><span>{pushStatus === "denied" ? "Permission is blocked in this browser" : pushStatus === "unsupported" ? "This browser does not support web push" : "Requires browser permission and secure hosting"}</span></div><Switch checked={settings.notifications.enabled && pushStatus === "subscribed"} disabled={pushStatus === "unsupported" || pushStatus === "denied"} onCheckedChange={(enabled) => { updateNotifications({ enabled }); onPushToggle?.(enabled); }} /></div>
            <div className="notification-status-row"><span className={cn("notification-status-dot", pushStatus === "subscribed" && "notification-status-dot--active")} /> <span>{pushStatus === "subscribed" ? "Browser subscribed" : pushStatus === "denied" ? "Notifications blocked" : pushStatus === "unsupported" ? "Push unavailable" : "Not subscribed"}</span>{pushStatus === "subscribed" && <Button type="button" variant="outline" size="sm" onClick={() => onPushTest?.()}>Send test</Button>}</div>
            <div className="notification-event-grid" aria-label="Notification event types">
              {NOTIFICATION_EVENTS.map((event) => <label key={event.key} className="notification-event-option"><input type="checkbox" checked={settings.notifications.eventTypes.includes(event.key)} onChange={() => toggleNotificationEvent(event.key)} /><span>{event.label}</span></label>)}
            </div>
            <div className="settings-subsection"><div className="settings-group__title"><p className="eyebrow">Competition targets</p><span>{settings.notifications.competitionSlugs.length ? `${settings.notifications.competitionSlugs.length} selected` : "All competitions"}</span></div><p className="settings-copy">Search the full ESPN directory. These targets are independent from the competitions shown on Matchday.</p><label className="settings-input"><span>Find competitions</span><input value={competitionQuery} onChange={(event) => setCompetitionQuery(event.target.value)} placeholder="Search leagues or cups" /></label><div className="notification-team-list">{notificationCompetitions.length ? notificationCompetitions.map((competition) => { const selected = settings.notifications.competitionSlugs.includes(competition.slug); return <button type="button" key={`notify-${competition.slug}`} className={cn("notification-team", selected && "notification-team--selected")} onClick={() => toggleNotificationCompetition(competition.slug)}><span>{competition.name}</span><b>{selected ? "Selected" : "Select"}</b></button>; }) : <span className="settings-muted">No competitions match that search.</span>}</div></div>
            <label className="settings-input"><span>Find teams from this matchday</span><input value={teamQuery} onChange={(event) => setTeamQuery(event.target.value)} placeholder="Search teams" /></label>
            <div className="notification-team-list">{teams.length ? teams.map((team) => <button type="button" key={team.id} className={cn("notification-team", settings.notifications.teamIds.includes(team.id) && "notification-team--selected")} onClick={() => toggleNotificationTeam(team.id)}><span>{team.name}</span><b>{settings.notifications.teamIds.includes(team.id) ? "Selected" : "Select"}</b></button>) : <span className="settings-muted">Load a matchday to discover teams.</span>}</div>
            <label className="switch-row switch-row--compact"><div><b>Pause all alerts</b><span>Keep your selections but temporarily stop delivery</span></div><Switch checked={settings.notifications.pauseAll} onCheckedChange={(pauseAll) => updateNotifications({ pauseAll })} /></label>
            <label className="switch-row switch-row--compact"><div><b>Daily digest</b><span>Receive one summary for selected competitions and teams</span></div><Switch checked={settings.notifications.digestEnabled} onCheckedChange={(digestEnabled) => updateNotifications({ digestEnabled })} /></label>
            {settings.notifications.digestEnabled && <label className="settings-input"><span>Digest time</span><input type="time" value={settings.notifications.digestTime} onChange={(event) => updateNotifications({ digestTime: event.target.value })} /></label>}
            <label className="switch-row switch-row--compact"><div><b>Quiet hours</b><span>Suppress non-critical alerts during a time window</span></div><Switch checked={settings.notifications.quietHoursEnabled} onCheckedChange={(quietHoursEnabled) => updateNotifications({ quietHoursEnabled })} /></label>
            {settings.notifications.quietHoursEnabled && <div className="quiet-hours-row"><label className="settings-input"><span>From</span><input type="time" value={settings.notifications.quietHoursStart} onChange={(event) => updateNotifications({ quietHoursStart: event.target.value })} /></label><label className="settings-input"><span>Until</span><input type="time" value={settings.notifications.quietHoursEnd} onChange={(event) => updateNotifications({ quietHoursEnd: event.target.value })} /></label></div>}
          </section>
        </div>
      </aside>

      {browseOpen && (
        <div className="browse-modal-layer" role="presentation">
          <button type="button" className="browse-modal-layer__backdrop" onClick={() => onBrowseOpen(false)} aria-label="Close competition browser" />
          <section className="browse-modal" aria-label="Browse competitions">
            <header className="browse-modal__head"><div><p className="eyebrow">Competition directory</p><h2>Find a competition</h2></div><Button variant="outline" size="sm" onClick={() => onBrowseOpen(false)}>Done</Button></header>
            <CompetitionBrowser directory={directory} selectedSlugs={settings.selectedSlugs} loading={directoryLoading} error={directoryError} onToggle={onToggleCompetition} />
          </section>
        </div>
      )}
    </div>
  );
}
