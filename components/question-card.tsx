'use client';

import { memo, useEffect, useState } from 'react';
import { Question } from '@/lib/questions';
import { CheckCircle2, AlertCircle, MessageSquare, ExternalLink, Circle, X } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  onStatusChange: (id: string, status: Question['status']) => void;
  onNotesChange: (id: string, notes: string) => void;
}

function QuestionCardComponent({ question, onStatusChange, onNotesChange }: QuestionCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(question.notes);

  useEffect(() => {
    if (!showNotes) setNotes(question.notes);
  }, [question.notes, showNotes]);

  const handleSaveNotes = () => {
    onNotesChange(question.id, notes);
    setShowNotes(false);
  };

  const handleCancelNotes = () => {
    setNotes(question.notes);
    setShowNotes(false);
  };

  const statusClass =
    question.status === 'done'
      ? 'question-card--done'
      : question.status === 'revise'
        ? 'question-card--revise'
        : '';

  const diffBadge =
    question.phase === 'Easy'
      ? 'badge-easy'
      : question.phase === 'Medium'
        ? 'badge-medium'
        : 'badge-hard';

  return (
    <article className={`question-card ${statusClass}`}>
      <div className="question-card-shine" />

      <div className="question-card-header">
        <div className="question-card-icon">
          {question.status === 'done' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={2} />
          ) : question.status === 'revise' ? (
            <AlertCircle className="w-5 h-5 text-amber-300" strokeWidth={2} />
          ) : (
            <Circle className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
          )}
        </div>

        <div className="question-card-body">
          <div className="question-card-meta">
            <span className="question-card-number">#{question.number}</span>
            <span className={`badge ${diffBadge}`}>{question.phase}</span>
          </div>

          <a
            href={question.leetcodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="question-card-title"
          >
            <span>{question.title}</span>
            <ExternalLink className="question-card-link-icon" strokeWidth={1.75} />
          </a>
        </div>
      </div>

      {question.notes && !showNotes && (
        <div className="question-card-notes-preview">
          <p>{question.notes}</p>
        </div>
      )}

      {showNotes && (
        <div className="question-card-notes-editor">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes, approaches, or hints…"
            className="glass-textarea"
            rows={3}
            autoFocus
          />
          <div className="question-card-notes-actions">
            <button type="button" onClick={handleSaveNotes} className="action-btn action-btn-save">
              Save Notes
            </button>
            <button type="button" onClick={handleCancelNotes} className="action-btn action-btn-cancel">
              <X className="w-3 h-3" strokeWidth={2.5} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showNotes && (
        <div className="question-card-actions">
          <button
            type="button"
            onClick={() => onStatusChange(question.id, 'todo')}
            className={`action-btn action-btn-todo ${question.status === 'todo' ? 'active' : ''}`}
          >
            To Do
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(question.id, 'done')}
            className={`action-btn action-btn-done ${question.status === 'done' ? 'active' : ''}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
            Done
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(question.id, 'revise')}
            className={`action-btn action-btn-revise ${question.status === 'revise' ? 'active' : ''}`}
          >
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
            Revise
          </button>

          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="action-btn action-btn-notes"
          >
            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
            {question.notes ? 'Edit Notes' : 'Notes'}
          </button>
        </div>
      )}
    </article>
  );
}

export const QuestionCard = memo(QuestionCardComponent);
