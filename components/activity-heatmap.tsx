'use client';

import { useMemo, useState } from 'react';
import { CompletionEvent, buildActivityHeatmap, getCompletionYears } from '@/lib/activity';

interface ActivityHeatmapProps {
  completionEvents: CompletionEvent[];
  /** Compact for profile; full for analytics */
  variant?: 'full' | 'compact';
  title?: string;
}

/** LeetCode submission-style orange levels */
const LEVEL_COLORS = [
  'rgba(255, 255, 255, 0.06)',
  'rgba(255, 161, 22, 0.25)',
  'rgba(255, 161, 22, 0.45)',
  'rgba(255, 161, 22, 0.7)',
  '#FFA116',
];

const DOW_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function ActivityHeatmap({
  completionEvents,
  variant = 'full',
  title = 'Submissions',
}: ActivityHeatmapProps) {
  const years = useMemo(() => getCompletionYears(completionEvents), [completionEvents]);
  const [yearMode, setYearMode] = useState<'rolling' | number>('rolling');

  const data = useMemo(
    () =>
      buildActivityHeatmap(
        completionEvents,
        new Date(),
        yearMode === 'rolling' ? undefined : yearMode
      ),
    [completionEvents, yearMode]
  );

  const [tip, setTip] = useState<{ date: string; count: number; x: number; y: number } | null>(
    null
  );

  const subtitle =
    yearMode === 'rolling'
      ? `${data.total} submissions in the past year`
      : `${data.total} submissions in ${yearMode}`;

  return (
    <div className={`glass-panel ${variant === 'compact' ? 'p-4' : 'p-5'} mb-6`}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
            {subtitle}
            <span style={{ color: '#64748B' }}>
              {' '}
              · {data.activeDays} active days · streak {data.currentStreak}d (best {data.bestStreak}d)
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setYearMode('rolling')}
            className={`filter-pill ${yearMode === 'rolling' ? 'active-all' : ''}`}
          >
            Past year
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYearMode(y)}
              className={`filter-pill ${yearMode === y ? 'active-all' : ''}`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="heatmap-scroll">
        <div className="heatmap-wrap">
          <div
            className="heatmap-months"
            style={{ gridTemplateColumns: `28px repeat(${data.weeks.length}, 11px)` }}
          >
            {data.monthLabels.map((m) => (
              <span
                key={`${m.label}-${m.weekIndex}`}
                className="heatmap-month"
                style={{ gridColumn: m.weekIndex + 2 }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="heatmap-body">
            <div className="heatmap-dow">
              {DOW_LABELS.map((label, i) => (
                <span key={i} className="heatmap-dow-label">
                  {label}
                </span>
              ))}
            </div>

            <div
              className="heatmap-grid"
              style={{ gridTemplateColumns: `repeat(${data.weeks.length}, 11px)` }}
            >
              {data.weeks.map((week, wi) =>
                week.map((day, di) => (
                  <button
                    key={`${day.date}-${wi}-${di}`}
                    type="button"
                    className="heatmap-cell"
                    style={{
                      background: LEVEL_COLORS[day.level],
                      gridRow: di + 1,
                      gridColumn: wi + 1,
                    }}
                    aria-label={`${day.count} on ${day.date}`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTip({
                        date: day.date,
                        count: day.count,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setTip(null)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span style={{ color: '#64748B' }}>Less</span>
        {LEVEL_COLORS.map((c, i) => (
          <span key={i} className="heatmap-cell heatmap-cell--legend" style={{ background: c }} />
        ))}
        <span style={{ color: '#64748B' }}>More</span>
      </div>

      {tip && (
        <div className="heatmap-tooltip" style={{ left: tip.x, top: tip.y }}>
          <strong>
            {tip.count} submission{tip.count === 1 ? '' : 's'}
          </strong>
          <span> on {tip.date}</span>
        </div>
      )}
    </div>
  );
}
