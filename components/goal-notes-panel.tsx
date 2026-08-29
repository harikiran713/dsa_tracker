'use client';

import { useState } from 'react';
import { GoalNote } from '@/lib/goal-notes';
import { Target, Plus, Trash2, Pencil, X, Check } from 'lucide-react';

interface GoalNotesPanelProps {
  userId: string;
  notes: GoalNote[];
  onNotesChange: (notes: GoalNote[]) => void;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function GoalNotesPanel({ userId, notes, onNotesChange }: GoalNotesPanelProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');

  const sorted = [...notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const addNote = () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const now = new Date().toISOString();
    const note: GoalNote = {
      id: `goal-${userId}-${Date.now()}`,
      user_id: userId,
      title: title.trim() || 'Untitled goal',
      text: trimmedText,
      created_at: now,
      updated_at: now,
    };
    onNotesChange([...notes, note]);
    setTitle('');
    setText('');
  };

  const startEdit = (note: GoalNote) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditText(note.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditText('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmedText = editText.trim();
    if (!trimmedText) return;

    onNotesChange(
      notes.map((n) =>
        n.id === editingId
          ? {
              ...n,
              title: editTitle.trim() || 'Untitled goal',
              text: trimmedText,
              updated_at: new Date().toISOString(),
            }
          : n
      )
    );
    cancelEdit();
  };

  const deleteNote = (id: string) => {
    onNotesChange(notes.filter((n) => n.id !== id));
    if (editingId === id) cancelEdit();
  };

  return (
    <div className="goal-notes-panel">
      <div className="glass-panel p-5 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(244,114,182,0.14)', border: '1px solid rgba(244,114,182,0.30)' }}
          >
            <Target className="w-5 h-5" style={{ color: '#F472B6' }} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-semibold text-white text-lg">Goal Notes</h2>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Private to your account — jot down future goals, plans, or reminders.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal title (optional) — e.g. Get FAANG-ready by Dec"
            className="glass-input w-full py-2.5 text-sm"
            style={{ borderRadius: 12, padding: '9px 16px' }}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote();
            }}
            placeholder="Describe your goal, plan, or note to future-you… (Ctrl/Cmd+Enter to save)"
            rows={3}
            className="glass-input w-full text-sm"
            style={{ borderRadius: 12, padding: 12, resize: 'vertical' }}
          />
          <button
            type="button"
            onClick={addNote}
            disabled={!text.trim()}
            className="btn btn-primary flex items-center gap-1.5 self-start disabled:opacity-40"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Add goal
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center py-16 gap-3">
          <Target className="w-9 h-9" style={{ color: '#475569' }} strokeWidth={1.5} />
          <div className="text-center">
            <p className="font-semibold text-white mb-1">No goal notes yet</p>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Write down a future goal above to get started.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((note) => {
            const editing = editingId === note.id;
            return (
              <li
                key={note.id}
                className="glass-panel p-4"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {editing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="glass-input w-full py-2 text-sm"
                      style={{ borderRadius: 12, padding: '8px 14px' }}
                    />
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="glass-input w-full text-sm"
                      style={{ borderRadius: 12, padding: 12, resize: 'vertical' }}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={saveEdit} className="btn btn-sm btn-primary flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        Save
                      </button>
                      <button type="button" onClick={cancelEdit} className="btn btn-sm btn-secondary flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h3 className="font-semibold text-white break-words">{note.title}</h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(note)}
                          className="goal-note-action-btn"
                          aria-label="Edit goal"
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNote(note.id)}
                          className="goal-note-action-btn"
                          aria-label="Delete goal"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words" style={{ color: '#CBD5E1' }}>
                      {note.text}
                    </p>
                    <p className="text-xs mt-2" style={{ color: '#475569' }}>
                      Updated {formatTimestamp(note.updated_at)}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
