'use client';

import { useMemo, useState } from 'react';
import {
  LLD_TOPICS,
  LldProgress,
  LldStatus,
  emptyLldProgress,
  getLldStats,
  lldProgressMap,
} from '@/lib/lld';
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Circle,
  MessageSquare,
  X,
} from 'lucide-react';

interface LldPanelProps {
  userId: string;
  progress: LldProgress[];
  onProgressChange: (rows: LldProgress[]) => void;
}

type StatusFilter = 'all' | LldStatus;

export function LldPanel({ userId, progress, onProgressChange }: LldPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [notesFor, setNotesFor] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const progressById = useMemo(() => lldProgressMap(progress), [progress]);
  const stats = useMemo(() => getLldStats(progress), [progress]);
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const upsert = (topicId: string, patch: Partial<LldProgress>) => {
    const existing = progressById.get(topicId) ?? emptyLldProgress(userId, topicId);
    const next: LldProgress = {
      ...existing,
      ...patch,
      topic_id: topicId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    onProgressChange([...progress.filter((p) => p.topic_id !== topicId), next]);
  };

  const setStatus = (topicId: string, status: LldStatus) => {
    upsert(topicId, { status });
  };

  const openNotes = (topicId: string) => {
    setNotesFor(topicId);
    setNotesDraft(progressById.get(topicId)?.notes ?? '');
  };

  const saveNotes = () => {
    if (!notesFor) return;
    upsert(notesFor, { notes: notesDraft });
    setNotesFor(null);
  };

  const getStatus = (topicId: string): LldStatus =>
    progressById.get(topicId)?.status ?? 'todo';

  const visible = LLD_TOPICS.filter((t) => {
    if (statusFilter === 'all') return true;
    return getStatus(t.id) === statusFilter;
  });

  return (
    <div className="lld-panel">
      <div className="glass-panel p-5 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.28)',
            }}
          >
            <Boxes className="w-5 h-5" style={{ color: '#38BDF8' }} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-semibold text-white text-lg">LLD</h2>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Low-level design topics for interviews. Track Done / Revise / notes.
            </p>
          </div>
        </div>

        <div className="lld-stats">
          <div className="lld-stat">
            <p className="lld-stat-label">Done</p>
            <p className="lld-stat-value" style={{ color: '#4ADE80' }}>{stats.done}</p>
          </div>
          <div className="lld-stat">
            <p className="lld-stat-label">Revise</p>
            <p className="lld-stat-value" style={{ color: '#FCD34D' }}>{stats.revise}</p>
          </div>
          <div className="lld-stat">
            <p className="lld-stat-label">To Do</p>
            <p className="lld-stat-value" style={{ color: '#94A3B8' }}>{stats.todo}</p>
          </div>
          <div className="lld-stat">
            <p className="lld-stat-label">Progress</p>
            <p className="lld-stat-value" style={{ color: '#38BDF8' }}>{pct}%</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg,#0EA5E9,#38BDF8)',
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
      </div>

      <div className="glass-panel p-4">
        <ul className="lld-list">
          {visible.map((topic) => {
            const status = getStatus(topic.id);
            const notes = progressById.get(topic.id)?.notes ?? '';
            const editing = notesFor === topic.id;
            const displayIndex = LLD_TOPICS.findIndex((t) => t.id === topic.id) + 1;

            return (
              <li
                key={topic.id}
                className={`lld-item ${status === 'done' ? 'lld-item--done' : ''} ${status === 'revise' ? 'lld-item--revise' : ''}`}
              >
                <div className="lld-item-main">
                  <div className="lld-item-status-icon">
                    {status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5" style={{ color: '#4ADE80' }} />
                    ) : status === 'revise' ? (
                      <AlertCircle className="w-5 h-5" style={{ color: '#FCD34D' }} />
                    ) : (
                      <Circle className="w-5 h-5" style={{ color: '#64748B' }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="lld-index">{displayIndex}</span>
                      <h3 className="lld-title">{topic.title}</h3>
                    </div>
                    <p className="lld-focus">{topic.focus}</p>
                    {notes && !editing && (
                      <p className="lld-notes-preview">{notes}</p>
                    )}
                  </div>
                </div>

                <div className="lld-item-actions">
                  <button
                    type="button"
                    className={`lld-status-btn ${status === 'done' ? 'is-active-done' : ''}`}
                    onClick={() => setStatus(topic.id, status === 'done' ? 'todo' : 'done')}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    className={`lld-status-btn ${status === 'revise' ? 'is-active-revise' : ''}`}
                    onClick={() => setStatus(topic.id, status === 'revise' ? 'todo' : 'revise')}
                  >
                    Revise
                  </button>
                  <button
                    type="button"
                    className="lld-status-btn"
                    onClick={() => openNotes(topic.id)}
                    aria-label="Notes"
                  >
                    <MessageSquare className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>

                {editing && (
                  <div className="lld-notes-editor">
                    <textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Classes, design patterns, edge cases…"
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

        {visible.length === 0 && (
          <p className="text-center py-10 text-sm" style={{ color: '#64748B' }}>
            No topics match this filter.
          </p>
        )}
      </div>
    </div>
  );
}
