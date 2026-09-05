'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  LAST_MIN_PREP_CATEGORIES,
  LastMinPrepCategory,
  LastMinPrepProgress,
  LastMinPrepQuestion,
  PrepStatus,
  emptyPrepProgress,
  getPrepStats,
  getUniqueQuestionsFromCategories,
  getPrepQuestionUrl,
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
  RotateCcw,
  Star,
  X,
} from 'lucide-react';
import { LeetCodeSyncResult } from '@/lib/leetcode-sync';

interface LastMinPrepPanelProps {
  userId: string;
  progress: LastMinPrepProgress[];
  onProgressChange: (rows: LastMinPrepProgress[]) => void;
  categories?: LastMinPrepCategory[];
  title?: string;
  description?: string;
  accent?: string;
  icon?: ReactNode;
  showTags?: boolean;
  leetcodeSync?: LeetCodeSyncResult | null;
}

type LeetCodeFilter = 'all' | 'unsolved' | 'solved';

type StatusFilter = 'all' | PrepStatus;

const SUBTOPIC_CATEGORY_IDS = new Set([
  'math',
  'bitmask-dp',
  'advanced-graphs',
  'advanced-strings',
  'advanced-range-xor',
]);

export function LastMinPrepPanel({
  userId,
  progress,
  onProgressChange,
  categories = LAST_MIN_PREP_CATEGORIES,
  title = 'Last Min Prep',
  description,
  accent = '#FB7185',
  icon,
  showTags = true,
  leetcodeSync,
}: LastMinPrepPanelProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [leetCodeFilter, setLeetCodeFilter] = useState<LeetCodeFilter>('all');
  const solvedIdSet = useMemo(
    () => new Set(leetcodeSync?.solvedIds ?? []),
    [leetcodeSync]
  );
  const [notesFor, setNotesFor] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const uniqueQuestions = useMemo(
    () => getUniqueQuestionsFromCategories(categories),
    [categories]
  );
  const uniqueTotal = uniqueQuestions.length;
  const progressMap = useMemo(() => progressMapFromRows(progress), [progress]);
  const stats = useMemo(
    () => getPrepStats(progress, uniqueQuestions),
    [progress, uniqueQuestions]
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

  const resetMyProgress = () => {
    const idsInThisPanel = new Set(uniqueQuestions.map((q) => q.leetcodeId));
    const remaining = progress.filter((p) => !idsInThisPanel.has(p.leetcode_id));
    onProgressChange(remaining);
    setConfirmReset(false);
    setNotesFor(null);
    setStatusFilter('all');
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
    if (statusFilter !== 'all' && getStatus(leetcodeId) !== statusFilter) return false;
    if (leetCodeFilter !== 'all') {
      const solvedOnLeetCode = solvedIdSet.has(leetcodeId);
      if (leetCodeFilter === 'unsolved' && solvedOnLeetCode) return false;
      if (leetCodeFilter === 'solved' && !solvedOnLeetCode) return false;
    }
    return true;
  };

  const totalVisible = uniqueQuestions.filter((q) => matchesFilter(q.leetcodeId)).length;
  const isFiltered = statusFilter !== 'all' || leetCodeFilter !== 'all';

  const pct = uniqueTotal > 0 ? Math.round((stats.done / uniqueTotal) * 100) : 0;
  const subtitle =
    description ??
    `${uniqueTotal} must-do problems across ${categories.length} patterns. Track Done / Revise / notes.`;

  return (
    <div className="last-min-prep">
      <div className="glass-panel p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `${accent}26`,
                border: `1px solid ${accent}47`,
              }}
            >
              {icon ?? <Rocket className="w-5 h-5" style={{ color: accent }} strokeWidth={1.75} />}
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">{title}</h2>
              <p className="text-sm" style={{ color: '#64748B' }}>
                {subtitle}
              </p>
            </div>
          </div>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="btn btn-sm btn-secondary flex items-center gap-1.5 self-start sm:self-center"
              title="Reset your progress only"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
              Reset my progress
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <span className="text-xs" style={{ color: '#FCD34D' }}>
                Clear Done/Revise for your account?
              </span>
              <button
                type="button"
                onClick={resetMyProgress}
                className="btn btn-sm btn-danger flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                Confirm reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="btn btn-sm btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
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
            <p className="last-min-stat-value" style={{ color: accent }}>{pct}%</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg,${accent},${accent}cc)`,
              }}
            />
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

        {leetcodeSync ? (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <span className="text-xs" style={{ color: '#64748B' }}>LeetCode:</span>
            {(['all', 'unsolved', 'solved'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setLeetCodeFilter(f)}
                className={`filter-pill capitalize ${leetCodeFilter === f ? `active-${f === 'unsolved' ? 'all' : f === 'solved' ? 'done' : 'all'}` : ''}`}
              >
                {f === 'all' ? 'All' : f === 'unsolved' ? 'Not done yet' : 'Already done'}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs mt-3" style={{ color: '#475569' }}>
            Connect LeetCode on the Problems tab to filter by solved status here too.
          </p>
        )}

        {isFiltered && (
          <p className="text-xs mt-3" style={{ color: '#94A3B8' }}>
            Showing <strong className="text-white tabular-nums">{totalVisible}</strong> of {uniqueTotal} questions
          </p>
        )}
      </div>

      <div className="last-min-categories">
        {categories.map((cat) => {
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
                  {(() => {
                    const showSubtopics = SUBTOPIC_CATEGORY_IDS.has(cat.id);
                    const subtopicIndex = new Map<string, number>();
                    if (showSubtopics) {
                      let n = 0;
                      for (const q of cat.questions) {
                        if (!subtopicIndex.has(q.pattern)) {
                          subtopicIndex.set(q.pattern, ++n);
                        }
                      }
                    }
                    let lastSubtopic: string | null = null;

                    // Surface must-do questions first, but only when there's no
                    // subtopic grouping to preserve (sorting would scatter it).
                    const orderedVisible = showSubtopics
                      ? visible
                      : [...visible].sort(
                          (a, b) => Number(!!b.important) - Number(!!a.important)
                        );

                    return orderedVisible.map((q, qi) => {
                      const status = getStatus(q.leetcodeId);
                      const notes = getNotes(q.leetcodeId);
                      const editing = notesFor === q.leetcodeId;
                      const showSubtopicHeader =
                        showSubtopics && q.pattern !== lastSubtopic;
                      if (showSubtopicHeader) lastSubtopic = q.pattern;
                      const subtopicNum = subtopicIndex.get(q.pattern);

                      return (
                        <li
                          key={`${cat.id}-${q.leetcodeId}-${q.pattern}-${qi}`}
                          className={`last-min-item ${status === 'done' ? 'last-min-item--done' : ''} ${status === 'revise' ? 'last-min-item--revise' : ''}`}
                        >
                          {showSubtopicHeader && (
                            <p className="last-min-subtopic" style={{ color: accent }}>
                              {subtopicNum}. {q.pattern}
                            </p>
                          )}
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
                                {q.important && (
                                  <span
                                    className="badge flex items-center gap-1"
                                    style={{ color: '#FBBF24', border: '1px solid #FBBF2447', background: '#FBBF241A' }}
                                    title="Must-do question"
                                  >
                                    <Star className="w-3 h-3" fill="#FBBF24" strokeWidth={0} />
                                    Important
                                  </span>
                                )}
                                {showTags && (
                                  <span className={`badge badge-${q.difficulty.toLowerCase()}`}>
                                    {q.difficulty}
                                  </span>
                                )}
                                {showTags && !showSubtopics && (
                                  <span className="badge badge-topic">{q.pattern}</span>
                                )}
                              </div>
                              <a
                                href={getPrepQuestionUrl(q)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="last-min-title"
                              >
                                {q.title}
                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                              </a>
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
                    });
                  })()}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
