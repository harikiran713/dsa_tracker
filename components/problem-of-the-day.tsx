'use client';

import { useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Flame,
  ListChecks,
} from 'lucide-react';
import { Question } from '@/lib/questions';
import {
  getProblemOfTheDay,
  getProblemSolveUrl,
} from '@/lib/problem-of-the-day';

interface ProblemOfTheDayProps {
  /** Progress-aware questions (status already merged). */
  questions: Question[];
  isLoading?: boolean;
  onStatusChange: (id: string, status: Question['status']) => void;
  onViewInProblems: (question: Question) => void;
}

export function ProblemOfTheDayCard({
  questions,
  isLoading = false,
  onStatusChange,
  onViewInProblems,
}: ProblemOfTheDayProps) {
  const potd = useMemo(() => getProblemOfTheDay(), []);

  const live = useMemo(() => {
    if (!potd.question) return null;
    return questions.find((q) => q.number === potd.question!.number) ?? potd.question;
  }, [questions, potd.question]);

  if (!potd.question || !live) {
    return (
      <div className="glass-panel p-5 mb-6">
        <p className="text-sm" style={{ color: '#64748B' }}>
          No Problem of the Day available.
        </p>
      </div>
    );
  }

  const solveUrl = getProblemSolveUrl(live);
  const status = live.status;
  const difficultyColor =
    live.phase === 'Easy' ? '#4ADE80' : live.phase === 'Medium' ? '#FCD34D' : '#F87171';

  return (
    <div className="glass-panel p-5 mb-6 potd-card">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(251,113,133,0.14)',
                border: '1px solid rgba(251,113,133,0.28)',
              }}
            >
              <Flame className="w-4 h-4" style={{ color: '#FB7185' }} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#FB7185' }}>
                Problem of the Day
              </p>
              <p className="text-[11px]" style={{ color: '#64748B' }}>
                {potd.dateIST} IST
                {potd.overridden ? ' · curated pick' : ' · daily pick for everyone'}
              </p>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm" style={{ color: '#64748B' }}>
              Loading your progress…
            </p>
          ) : (
            <>
              <button
                type="button"
                className="text-left group"
                onClick={() => {
                  if (solveUrl) window.open(solveUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <h3 className="text-xl font-semibold text-white group-hover:text-[#FB7185] transition-colors flex items-center gap-2 flex-wrap">
                  {live.title}
                  {solveUrl && (
                    <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-70" strokeWidth={2} />
                  )}
                </h3>
              </button>

              <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                <span
                  className={`badge badge-${live.phase.toLowerCase()}`}
                  style={{ color: difficultyColor }}
                >
                  {live.phase}
                </span>
                <span className="text-sm" style={{ color: '#94A3B8' }}>
                  #{live.number} · Curated DSA set
                </span>
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#94A3B8' }}>
                  {status === 'done' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                      <span style={{ color: '#4ADE80' }}>Done</span>
                    </>
                  ) : status === 'revise' ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" style={{ color: '#FCD34D' }} />
                      <span style={{ color: '#FCD34D' }}>Revise</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5" />
                      To Do
                    </>
                  )}
                </span>
              </div>
            </>
          )}
        </div>

        {!isLoading && (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {solveUrl ? (
              <a
                href={solveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-primary flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Solve Problem
              </a>
            ) : (
              <button type="button" className="btn btn-sm btn-secondary" disabled>
                No link available
              </button>
            )}

            <button
              type="button"
              className="btn btn-sm btn-secondary flex items-center gap-1.5"
              onClick={() => onViewInProblems(live)}
            >
              <ListChecks className="w-3.5 h-3.5" />
              View in Problems
            </button>

            <button
              type="button"
              className={`btn btn-sm ${status === 'done' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-1.5`}
              onClick={() =>
                onStatusChange(live.id, status === 'done' ? 'todo' : 'done')
              }
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {status === 'done' ? 'Done ✓' : 'Mark Done'}
            </button>

            <button
              type="button"
              className={`btn btn-sm ${status === 'revise' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-1.5`}
              onClick={() =>
                onStatusChange(live.id, status === 'revise' ? 'todo' : 'revise')
              }
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {status === 'revise' ? 'Revise ✓' : 'Mark Revise'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
