'use client';

import { useMemo, useState } from 'react';
import {
  LAST_MIN_PREP_CATEGORIES,
  LastMinPrepProgress,
  LastMinPrepQuestion,
  PrepStatus,
  emptyPrepProgress,
  getPrepStats,
  getUniqueLastMinPrepQuestions,
  lastMinPrepLeetcodeUrl,
  progressMapFromRows,
} from '@/lib/last-min-prep';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ExternalLink,
  MessageSquare,
  Rocket,
  X,
} from 'lucide-react';

interface LastMinPrepPanelProps {
  userId: string;
  progress: LastMinPrepProgress[];
  onProgressChange: (rows: LastMinPrepProgress[]) => void;
}

type StatusFilter = 'all' | PrepStatus;

export function LastMinPrepPanel({
  userId,
  progress,
  onProgressChange,
}: LastMinPrepPanelProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(
    LAST_MIN_PREP_CATEGORIES[0]?.id ?? null
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [notesFor, setNotesFor] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const uniqueTotal = useMemo(() => getUniqueLastMinPrepQuestions().length, []);
  const progressMap = useMemo(() => progressMapFromRows(progress), [progress]);
  const stats = useMemo(
    () => getPrepStats(progress, uniqueTotal),
    [progress, uniqueTotal]
  );

  const upsert = (leetcodeId: number, patch: Partial<LastMinPrepProgress>) => {
    const existing = progressMap.get(leetcodeId) ?? emptyPrepProgress(userId, leetcodeId);
    const next: LastMinPrepProgress = {
      ...existing,
      ...patch,
      leetcode_id: leetcodeId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    const others = progress.filter((p) => p.leetcode_id !== leetcodeId);
    onProgressChange([...others, next]);
  };

  const setStatus = (leetcodeId: number, status: PrepStatus) => {
    upsert(leetcodeId, { status });
  };

  const openNotes = (q: LastMinPrepQuestion) => {
    const row = progressMap.get(q.leetcodeId);
    setNotesFor(q.leetcodeId);
    setNotesDraft(row?.notes ?? '');
  };

  const saveNotes = () => {
    if (notesFor == null) return;
    upsert(notesFor, { notes: notesDraft });
    setNotesFor(null);
  };

  const getStatus = (leetcodeId: number): PrepStatus =>
    progressMap.get(leetcodeId)?.status ?? 'todo';

  const getNotes = (leetcodeId: number): string =>
    progressMap.get(leetcodeId)?.notes ?? '';

  const matchesFilter = (leetcodeId: number) => {
    if (statusFilter === 'all') return true;
    return getStatus(leetcodeId) === statusFilter;
  };

  const pct = uniqueTotal > 0 ? Math.round((stats.done / uniqueTotal) * 100) : 0;

  return (
    <div className="last-min-prep">
      <div className="glass-panel p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(244,63,94,0.15)',
                border: '1px solid rgba(244,63,94,0.28)',
              }}
            >
              <Rocket className="w-5 h-5" style={{ color: '#FB7185' }} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">Last Min Prep</h2>
              <p className="text-sm" style={{ color: '#64748B' }}>
                {uniqueTotal} must-do problems across 30 patterns. Track Done / Revise / notes.
              </p>
            </div>
          </div>
        </div>

        <div className="last-min-stats">
          <div className="last-min-stat">
            <p className="last-min-stat-label">Done</p>
            <p className="last-min-stat-value" style={{ color: '#4ADE80' }}>{stats.done}</p>
          </div>
          <div className="last-min-stat">
            <p className="last-min-stat-label">Revise</p>
            <p className="last-min-stat-value" style={{ color: '#FCD34D' }}>{stats.revise}</p>
          </div>
          <div className="last-min-stat">
            <p className="last-min-stat-label">To Do</p>
            <p className="last-min-stat-value" style={{ color: '#94A3B8' }}>{stats.todo}</p>
          </div>
          <div className="last-min-stat">
            <p className="last-min-stat-label">Progress</p>
            <p className="last-min-stat-value" style={{ color: '#FB7185' }}>{pct}%</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#F43F5E,#FB7185)' }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {(['all', 'todo', 'done', 'revise'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`filter-pill capitalize ${statusFilter === f ? `active-${f === 'todo' ? 'all' : f}` : ''}`}
            >
              {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : f === 'done' ? 'Done' : 'Revise'}
            </button>
          ))}
        </div>
      </div>

      <div className="last-min-categories">
        {LAST_MIN_PREP_CATEGORIES.map((cat) => {
          const visible = cat.questions.filter((q) => matchesFilter(q.leetcodeId));
          if (statusFilter !== 'all' && visible.length === 0) return null;

          const catDone = cat.questions.filter((q) => getStatus(q.leetcodeId) === 'done').length;
          const isOpen = openCategory === cat.id;

          return (
            <div key={cat.id} className="glass-panel last-min-category mb-3">
              <button
                type="button"
                className="last-min-category-header"
                onClick={() => setOpenCategory(isOpen ? null : cat.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#94A3B8' }} />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#94A3B8' }} />
                  )}
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-white truncate">{cat.name}</p>
                    <p className="text-xs truncate" style={{ color: '#64748B' }}>{cat.pattern}</p>
                  </div>
                </div>
                <span className="text-sm tabular-nums flex-shrink-0" style={{ color: '#94A3B8' }}>
                  {catDone}/{cat.questions.length}
                </span>
              </button>

              {isOpen && (
                <ul className="last-min-list">
                  {visible.map((q) => {
                    const status = getStatus(q.leetcodeId);
                    const notes = getNotes(q.leetcodeId);
                    const editing = notesFor === q.leetcodeId;

                    return (
                      <li
                        key={`${cat.id}-${q.leetcodeId}`}
                        className={`last-min-item ${status === 'done' ? 'last-min-item--done' : ''} ${status === 'revise' ? 'last-min-item--revise' : ''}`}
                      >
                        <div className="last-min-item-main">
                          <div className="last-min-item-status-icon">
                            {status === 'done' ? (
                              <CheckCircle2 className="w-4 h-4" style={{ color: '#4ADE80' }} />
                            ) : status === 'revise' ? (
                              <AlertCircle className="w-4 h-4" style={{ color: '#FCD34D' }} />
                            ) : (
                              <Circle className="w-4 h-4" style={{ color: '#64748B' }} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="last-min-lc">#{q.leetcodeId}</span>
                              <span className={`badge badge-${q.difficulty.toLowerCase()}`}>
                                {q.difficulty}
                              </span>
                            </div>
                            <a
                              href={lastMinPrepLeetcodeUrl(q.title, q.leetcodeId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="last-min-title"
                            >
                              {q.title}
                              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                            </a>
                            <p className="text-xs mt-1" style={{ color: '#64748B' }}>{q.pattern}</p>
                            {notes && !editing && (
                              <p className="last-min-notes-preview">{notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="last-min-item-actions">
                          <button
                            type="button"
                            className={`last-min-status-btn ${status === 'done' ? 'is-active-done' : ''}`}
                            onClick={() => setStatus(q.leetcodeId, status === 'done' ? 'todo' : 'done')}
                          >
                            Done
                          </button>
                          <button
                            type="button"
                            className={`last-min-status-btn ${status === 'revise' ? 'is-active-revise' : ''}`}
                            onClick={() => setStatus(q.leetcodeId, status === 'revise' ? 'todo' : 'revise')}
                          >
                            Revise
                          </button>
                          <button
                            type="button"
                            className="last-min-status-btn"
                            onClick={() => openNotes(q)}
                            aria-label="Notes"
                          >
                            <MessageSquare className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>

                        {editing && (
                          <div className="last-min-notes-editor">
                            <textarea
                              value={notesDraft}
                              onChange={(e) => setNotesDraft(e.target.value)}
                              placeholder="Notes, approach, pitfalls…"
                              rows={3}
                              className="glass-input w-full text-sm"
                              style={{ borderRadius: 12, padding: 12, resize: 'vertical' }}
                            />
                            <div className="flex gap-2 mt-2">
                              <button type="button" className="btn btn-sm btn-primary" onClick={saveNotes}>
                                Save notes
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setNotesFor(null)}
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
