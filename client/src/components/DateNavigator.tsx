/**
 * FootyScores Pro — Matchday Ledger component.
 * A compact paper-ticket date rail with clear CAT-local matchday navigation.
 */

import { CalendarDays, ChevronLeft, ChevronRight, Radio } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { catDateKey, catDateLabel, catDayName } from "@/lib/espn";

interface DateNavigatorProps {
  value: string;
  onChange: (dateKey: string) => void;
  compact?: boolean;
}

function dateFromKey(key: string) {
  return new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(4, 6)) - 1, Number(key.slice(6, 8)), 12));
}

function offsetDate(key: string, offset: number) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + offset);
  return catDateKey(date);
}

function toInputValue(key: string) {
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
}

export function DateNavigator({ value, onChange, compact = true }: DateNavigatorProps) {
  const today = catDateKey(new Date());
  const [weekView, setWeekView] = useState(!compact);
  const dayCount = weekView ? 7 : 5;
  const days = Array.from({ length: dayCount }, (_, index) => offsetDate(value, index - Math.floor(dayCount / 2)));

  return (
    <section className={cn("date-navigator", compact && "date-navigator--compact")} aria-label="Match date navigation">
      <div className="date-navigator__heading">
        <div>
          <p className="eyebrow">Matchday</p>
          <h2>{catDateLabel(value, true)}</h2>
        </div>
        <div className="date-navigator__utilities">
          <button type="button" className="date-today-button" onClick={() => onChange(today)} disabled={value === today}><Radio size={11} /> Live</button>
          <button type="button" className="date-today-button" onClick={() => setWeekView((current) => !current)} aria-pressed={weekView}>{weekView ? "5 days" : "Week"}</button>
          <span className="timezone-pill">CAT · UTC+2</span>
        </div>
      </div>

      <div className="date-navigator__controls">
        <Button variant="ghost" size="icon" className="icon-button" onClick={() => onChange(offsetDate(value, -1))} aria-label="Previous day">
          <ChevronLeft size={18} strokeWidth={2.3} />
        </Button>
        <div className="date-strip" role="list" aria-label="Available dates">
          {days.map((day) => {
            const selected = day === value;
            const label = catDateLabel(day, true);
            return (
              <button
                key={day}
                type="button"
                role="listitem"
                onClick={() => onChange(day)}
                className={cn("day-ticket", selected && "day-ticket--selected", day === today && "day-ticket--today")}
                aria-pressed={selected}
              >
                <span>{catDayName(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}T12:00:00Z`)}</span>
                <strong>{label.split(" ")[1]}</strong>
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" className="icon-button" onClick={() => onChange(offsetDate(value, 1))} aria-label="Next day">
          <ChevronRight size={18} strokeWidth={2.3} />
        </Button>
        <label className="calendar-trigger" aria-label="Choose a date">
          <CalendarDays size={16} />
          <input
            type="date"
            value={toInputValue(value)}
            onChange={(event) => onChange(event.target.value.replaceAll("-", ""))}
          />
        </label>
      </div>
    </section>
  );
}
