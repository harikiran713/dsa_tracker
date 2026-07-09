'use client';

import { useMemo, useState } from 'react';
import { Question } from '@/lib/questions';
import {
  DailyTodoItem,
  getTodosForDate,
  toDateKey,
  formatDayLabel,
} from '@/lib/activity';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ListTodo,
  ExternalLink,
  Hash,
} from 'lucide-react';

interface DailyTodoPanelProps {
  todos: DailyTodoItem[];
  onTodosChange: (todos: DailyTodoItem[]) => void;
  userId: string;
  questions: Question[];
}

function parseQuestionNumber(input: string): number | null {
  const trimmed = input.trim();
  const hashMatch = trimmed.match(/^#\s*(\d+)$/);
  if (hashMatch) return parseInt(hashMatch[1], 10);
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  return null;
}

export function DailyTodoPanel({ todos, onTodosChange, userId, questions }: DailyTodoPanelProps) {
  const [selectedDate, setSelectedDate] = useState(() => toDateKey());
  const [newText, setNewText] = useState('');
  const [questionNumber, setQuestionNumber] = useState('');
  const [addError, setAddError] = useState('');

  const questionByNumber = useMemo(() => {
    const map = new Map<number, Question>();
    for (const q of questions) map.set(q.number, q);
    return map;
  }, [questions]);

  const dayTodos = useMemo(
    () => getTodosForDate(todos, selectedDate),
    [todos, selectedDate]
  );

  const doneCount = dayTodos.filter((t) => t.done).length;
  const isToday = selectedDate === toDateKey();

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateKey(d));
  };

  const isDuplicateQuestion = (num: number) =>
    dayTodos.some((t) => t.question_id === num);

  const addQuestionTodo = (num: number): boolean => {
    const question = questionByNumber.get(num);
    if (!question) {
      setAddError(`Question #${num} not found. Use a number between 1 and ${questions.length}.`);
      return false;
    }
    if (isDuplicateQuestion(num)) {
      setAddError(`Question #${num} is already on this day's list.`);
      return false;
    }

    const item: DailyTodoItem = {
      id: `todo-${userId}-q${num}-${Date.now()}`,
      user_id: userId,
      date: selectedDate,
      text: `#${num} — ${question.title}`,
      done: false,
      question_id: num,
      question_title: question.title,
      question_phase: question.phase,
      created_at: new Date().toISOString(),
    };
    onTodosChange([...todos, item]);
    setAddError('');
    return true;
  };

  const addTodo = () => {
    const text = newText.trim();
    if (!text) return;

    const parsed = parseQuestionNumber(text);
    if (parsed !== null) {
      if (addQuestionTodo(parsed)) setNewText('');
      return;
    }

    const item: DailyTodoItem = {
      id: `todo-${userId}-${Date.now()}`,
      user_id: userId,
      date: selectedDate,
      text,
      done: false,
      created_at: new Date().toISOString(),
    };
    onTodosChange([...todos, item]);
    setNewText('');
    setAddError('');
  };

  const addQuestionByNumber = () => {
    const num = parseQuestionNumber(questionNumber);
    if (num === null) {
      setAddError('Enter a valid question number (e.g. 23 or #23).');
      return;
    }
    if (addQuestionTodo(num)) setQuestionNumber('');
  };

  const toggleTodo = (id: string) => {
    onTodosChange(
      todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id: string) => {
    onTodosChange(todos.filter((t) => t.id !== id));
  };

  const goToToday = () => setSelectedDate(toDateKey());

  return (
    <div className="daily-todo-panel">
      <div className="glass-panel p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.22)' }}
            >
              <ListTodo className="w-4 h-4" style={{ color: '#60A5FA' }} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Daily Todo List</h2>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Add custom tasks or link a problem by its #number
              </p>
            </div>
          </div>

          {!isToday && (
            <button type="button" onClick={goToToday} className="btn btn-sm btn-secondary">
              <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
              Today
            </button>
          )}
        </div>

        <div className="date-nav">
          <button type="button" onClick={() => shiftDate(-1)} className="date-nav-btn" aria-label="Previous day">
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <div className="date-nav-center">
            <p className="text-lg font-bold text-white">{formatDayLabel(selectedDate)}</p>
            {isToday && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
                Today
              </span>
            )}
          </div>
          <button type="button" onClick={() => shiftDate(1)} className="date-nav-btn" aria-label="Next day">
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: '#94A3B8' }}>Day progress</span>
            <span className="font-semibold tabular-nums text-white">
              {doneCount} / {dayTodos.length} done
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: dayTodos.length > 0 ? `${Math.round((doneCount / dayTodos.length) * 100)}%` : '0%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Add question by number */}
      <div className="glass-panel p-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>
          Add question by number
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-[200px]">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#64748B' }} strokeWidth={1.75} />
            <input
              type="text"
              inputMode="numeric"
              value={questionNumber}
              onChange={(e) => {
                setQuestionNumber(e.target.value);
                setAddError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && addQuestionByNumber()}
              placeholder="e.g. 23"
              className="glass-input w-full py-2.5 text-sm"
              style={{ borderRadius: '12px', padding: '9px 16px 9px 36px' }}
            />
          </div>
          <button type="button" onClick={addQuestionByNumber} className="btn btn-primary flex items-center gap-1.5 flex-shrink-0">
            <Plus className="w-4 h-4" strokeWidth={2} />
            Add Question
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: '#475569' }}>
          Maps directly to the problem with that number in your list.
        </p>
      </div>

      {/* Add custom todo */}
      <div className="glass-panel p-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>
          Add custom task
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => {
              setNewText(e.target.value);
              setAddError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder={`Task for ${isToday ? 'today' : formatDayLabel(selectedDate)}… or type #23`}
            className="glass-input flex-1 py-2.5 text-sm"
            style={{ borderRadius: '12px', padding: '9px 16px' }}
          />
          <button type="button" onClick={addTodo} className="btn btn-secondary flex items-center gap-1.5 flex-shrink-0">
            <Plus className="w-4 h-4" strokeWidth={2} />
            Add
          </button>
        </div>
        {addError && (
          <p className="text-xs mt-2" style={{ color: '#FCA5A5' }}>{addError}</p>
        )}
      </div>

      {/* Todo list */}
      <div className="glass-panel p-5">
        {dayTodos.length === 0 ? (
          <div className="text-center py-12">
            <Circle className="w-10 h-10 mx-auto mb-3" style={{ color: '#475569' }} strokeWidth={1.5} />
            <p className="font-medium text-white mb-1">No tasks for this day</p>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Add a question by number (e.g. 42) or a custom study task.
            </p>
          </div>
        ) : (
          <ul className="todo-list">
            {dayTodos.map((todo) => {
              const linkedQuestion = todo.question_id
                ? questionByNumber.get(todo.question_id)
                : undefined;

              return (
                <li
                  key={todo.id}
                  className={`todo-item ${todo.done ? 'todo-item--done' : ''} ${todo.question_id ? 'todo-item--question' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    className="todo-check-btn"
                    aria-label={todo.done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {todo.done ? (
                      <CheckCircle2 className="w-5 h-5" style={{ color: '#4ADE80' }} strokeWidth={2} />
                    ) : (
                      <Circle className="w-5 h-5" style={{ color: '#64748B' }} strokeWidth={2} />
                    )}
                  </button>

                  {todo.question_id ? (
                    <div className={`todo-question-body ${todo.done ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="todo-q-number">#{todo.question_id}</span>
                        {todo.question_phase && (
                          <span className={`badge badge-${todo.question_phase.toLowerCase()}`}>
                            {todo.question_phase}
                          </span>
                        )}
                      </div>
                      {linkedQuestion?.leetcodeUrl ? (
                        <a
                          href={linkedQuestion.leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`todo-question-link ${todo.done ? 'line-through' : ''}`}
                        >
                          {todo.question_title ?? todo.text}
                          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                        </a>
                      ) : (
                        <span className={`todo-text ${todo.done ? 'line-through' : ''}`}>
                          {todo.question_title ?? todo.text}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={`todo-text ${todo.done ? 'line-through' : ''}`}>{todo.text}</span>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="todo-delete-btn"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
