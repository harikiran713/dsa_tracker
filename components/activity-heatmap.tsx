'use client';

import { useMemo, useState } from 'react';
import { CompletionEvent, buildActivityHeatmap } from '@/lib/activity';
import { Flame } from 'lucide-react';

interface ActivityHeatmapProps {
  completionEvents: CompletionEvent[];
}

const LEVEL_COLORS = [
  'rgba(255,255,255,0.06)',
  '#0E4429',
  '#006D32',
  '#26A641',
  '#39D353',
];

const DOW_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function ActivityHeatmap({ completionEvents }: ActivityHeatmapProps) {
  const data = useMemo(() => buildActivityHeatmap(completionEvents), [completionEvents]);
  const [tip, setTip] = useState<{ date: string; count: number; x: number; y: number } | null>(
    null
  );

  return (
    <div className="glass-panel p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(57,211,83,0.12)',
              border: '1px solid rgba(57,211,83,0.25)',
            }}
          >
            <Flame className="w-4 h-4" style={{ color: '#39D353' }} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Contribution heatmap</h3>
            <p className="text-xs" style={{ color: '#64748B' }}>
              {data.total} problems in the last year · {data.activeDays} active days
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-xs tabular-nums" style={{ color: '#94A3B8' }}>
          <span>
            Current streak{' '}
            <strong className="text-white">{data.currentStreak}</strong>d
          </span>
          <span>
            Best{' '}
            <strong className="text-white">{data.bestStreak}</strong>d
          </span>
        </div>
      </div>

      <div className="heatmap-scroll">
        <div className="heatmap-wrap">
          <div className="heatmap-months">
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
        <div
          className="heatmap-tooltip"
          style={{ left: tip.x, top: tip.y }}
        >
          <strong>
            {tip.count} problem{tip.count === 1 ? '' : 's'}
          </strong>
          <span> on {tip.date}</span>
        </div>
      )}
    </div>
  );
}
