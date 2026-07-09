'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { initializeQuestions, Question } from '@/lib/questions';
import { LoginScreen } from './login-screen';
import { VirtualQuestionGrid } from './virtual-question-grid';
import { DailyTodoPanel } from './daily-todo-panel';
import { StatsDashboard } from './stats-dashboard';
import { getOrCreateUser, getUserProgress, updateQuestionProgress } from '@/lib/db-service';
import { User, UserProgress } from '@/lib/supabase';
import {
  CompletionEvent,
  DailyTodoItem,
  loadCompletionEvents,
  loadDailyTodos,
  saveCompletionEvents,
  saveDailyTodos,
} from '@/lib/activity';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useScrollPerformance } from '@/hooks/use-scroll-performance';
import {
  Search, LogOut, Code2, BarChart3, CheckCircle2,
  AlertCircle, ListTodo, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';

type FilterStatus     = 'all' | 'done' | 'revise';
type FilterDifficulty = 'all' | 'Easy' | 'Medium' | 'Hard';
type MainTab = 'problems' | 'todos' | 'analytics';

interface PhaseSection {
  label: string;
  questions: Question[];
  color: string;
  glow: string;
  dotColor: string;
  badgeClass: string;
}

export function DashboardNew() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userProgress, setUserProgress] = useState<Map<number, UserProgress>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('all');
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(
    () => new Set(['Medium', 'Hard'])
  );
  const [activeTab, setActiveTab] = useState<MainTab>('problems');
  const [completionEvents, setCompletionEvents] = useState<CompletionEvent[]>([]);
  const [dailyTodos, setDailyTodos] = useState<DailyTodoItem[]>([]);

  const debouncedSearch = useDebouncedValue(searchQuery, 180);
  useScrollPerformance();

  useEffect(() => { setQuestions(initializeQuestions()); }, []);

  useEffect(() => {
    const savedUsername = localStorage.getItem('interview_prep_username');
    if (savedUsername) handleLogin(savedUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (username: string) => {
    setIsLoadingAuth(true);
    try {
      const user = await getOrCreateUser(username);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('interview_prep_username', username);
        await loadUserProgress(user.id);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadUserProgress = async (userId: string) => {
    setIsLoadingData(true);
    try {
      const progress = await getUserProgress(userId);
      const progressMap = new Map<number, UserProgress>();
      progress.forEach((p) => progressMap.set(p.question_id, p));
      setUserProgress(progressMap);

      let events = loadCompletionEvents(userId);
      if (events.length === 0) {
        const backfill: CompletionEvent[] = progress
          .filter((p) => p.status === 'done')
          .map((p) => ({
            id: `backfill-${userId}-${p.question_id}`,
            user_id: userId,
            question_id: p.question_id,
            question_title: p.question_title,
            question_phase: p.question_phase as 'Easy' | 'Medium' | 'Hard',
            completed_at: p.updated_at,
          }));
        if (backfill.length > 0) {
          events = backfill;
          saveCompletionEvents(userId, events);
        }
      }
      setCompletionEvents(events);
      setDailyTodos(loadDailyTodos(userId));
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleStatusChange = useCallback(async (questionId: string, newStatus: Question['status']) => {
    if (!currentUser) return;
    const numId = parseInt(questionId.split('-')[1]);
    const question = questions.find((q) => q.number === numId);
    if (!question) return;

    const prevStatus = userProgress.get(numId)?.status;
    const updatedProgress = new Map(userProgress);
    updatedProgress.set(numId, {
      id: `progress-${numId}`,
      user_id: currentUser.id,
      question_id: numId,
      question_title: question.title,
      question_phase: question.phase,
      status: newStatus,
      notes: updatedProgress.get(numId)?.notes || '',
      updated_at: new Date().toISOString(),
    });
    setUserProgress(updatedProgress);

    await updateQuestionProgress(
      currentUser.id, numId, question.title, question.phase,
      newStatus, updatedProgress.get(numId)?.notes || ''
    );

    if (newStatus === 'done' && prevStatus !== 'done') {
      setCompletionEvents(loadCompletionEvents(currentUser.id));
    }
  }, [currentUser, questions, userProgress]);

  const handleTodosChange = useCallback((todos: DailyTodoItem[]) => {
    if (!currentUser) return;
    setDailyTodos(todos);
    saveDailyTodos(currentUser.id, todos);
  }, [currentUser]);

  const handleNotesChange = useCallback(async (questionId: string, notes: string) => {
    if (!currentUser) return;
    const numId = parseInt(questionId.split('-')[1]);
    const question = questions.find((q) => q.number === numId);
    if (!question) return;

    const updatedProgress = new Map(userProgress);
    const existing = updatedProgress.get(numId);
    updatedProgress.set(numId, {
      id: `progress-${numId}`,
      user_id: currentUser.id,
      question_id: numId,
      question_title: question.title,
      question_phase: question.phase,
      status: (existing?.status || 'todo') as Question['status'],
      notes,
      updated_at: new Date().toISOString(),
    });
    setUserProgress(updatedProgress);

    await updateQuestionProgress(
      currentUser.id, numId, question.title, question.phase,
      (existing?.status || 'todo') as Question['status'], notes
    );
  }, [currentUser, questions, userProgress]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('interview_prep_username');
    setUserProgress(new Map());
    setCompletionEvents([]);
    setDailyTodos([]);
    setActiveTab('problems');
    setSearchQuery('');
    setFilterStatus('all');
    setFilterDifficulty('all');
  };

  const questionsWithProgress = useMemo(
    () =>
      questions.map((q) => {
        const p = userProgress.get(q.number);
        return {
          ...q,
          status: (p?.status || 'todo') as Question['status'],
          notes: p?.notes || '',
        };
      }),
    [questions, userProgress]
  );

  const filtered = useMemo(() => {
    let result = questionsWithProgress;
    if (filterStatus !== 'all') result = result.filter((q) => q.status === filterStatus);
    if (filterDifficulty !== 'all') result = result.filter((q) => q.phase === filterDifficulty);
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (q) =>
          q.title.toLowerCase().includes(query) ||
          q.number.toString().includes(query) ||
          q.phase.toLowerCase().includes(query)
      );
    }
    return result;
  }, [questionsWithProgress, filterStatus, filterDifficulty, debouncedSearch]);

  const stats = useMemo(() => {
    const completed = questionsWithProgress.filter((q) => q.status === 'done').length;
    const revise = questionsWithProgress.filter((q) => q.status === 'revise').length;
    const toDo = questionsWithProgress.filter((q) => q.status === 'todo').length;
    const progress =
      questionsWithProgress.length > 0
        ? Math.round((completed / questionsWithProgress.length) * 100)
        : 0;
    return {
      total: questionsWithProgress.length,
      completed,
      revise,
      toDo,
      progress,
    };
  }, [questionsWithProgress]);

  const phases: PhaseSection[] = useMemo(
    () => [
      {
        label: 'Easy',
        questions: filtered.filter((q) => q.phase === 'Easy'),
        color: '#4ADE80',
        glow: 'rgba(34,197,94,0.20)',
        dotColor: '#22C55E',
        badgeClass: 'badge-easy',
      },
      {
        label: 'Medium',
        questions: filtered.filter((q) => q.phase === 'Medium'),
        color: '#FCD34D',
        glow: 'rgba(245,158,11,0.20)',
        dotColor: '#F59E0B',
        badgeClass: 'badge-medium',
      },
      {
        label: 'Hard',
        questions: filtered.filter((q) => q.phase === 'Hard'),
        color: '#FCA5A5',
        glow: 'rgba(239,68,68,0.20)',
        dotColor: '#EF4444',
        badgeClass: 'badge-hard',
      },
    ],
    [filtered]
  );

  const togglePhase = (phase: string) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      next.has(phase) ? next.delete(phase) : next.add(phase);
      return next;
    });
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} isLoading={isLoadingAuth} />;
  }

  const statCards = [
    {
      label: 'Total',
      value: stats.total,
      icon: ListTodo,
      iconBg: 'rgba(59,130,246,0.18)',
      iconColor: '#60A5FA',
      valueColor: '#FFFFFF',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      iconBg: 'rgba(34,197,94,0.18)',
      iconColor: '#4ADE80',
      valueColor: '#4ADE80',
    },
    {
      label: 'Revise',
      value: stats.revise,
      icon: AlertCircle,
      iconBg: 'rgba(245,158,11,0.18)',
      iconColor: '#FCD34D',
      valueColor: '#FCD34D',
    },
    {
      label: 'To Do',
      value: stats.toDo,
      icon: ListTodo,
      iconBg: 'rgba(148,163,184,0.14)',
      iconColor: '#94A3B8',
      valueColor: '#CBD5E1',
    },
    {
      label: 'Progress',
      value: `${stats.progress}%`,
      icon: TrendingUp,
      iconBg: 'rgba(139,92,246,0.18)',
      iconColor: '#C4B5FD',
      valueColor: '#C4B5FD',
    },
  ];

  return (
    <main className="app-shell relative min-h-screen overflow-x-hidden">
      {/* Background blobs */}
      <div className="bg-blobs">
        <div className="blob blob-blue"   style={{ width: 700, height: 700, top: '-15%',  left: '-20%' }} />
        <div className="blob blob-purple" style={{ width: 550, height: 550, bottom: '-8%', right: '-12%' }} />
        <div className="blob blob-cyan"   style={{ width: 350, height: 350, top: '42%',   left: '58%'  }} />
      </div>

      {/* ── STICKY HEADER ──────────────────────────────────────────── */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)', boxShadow: '0 6px 20px rgba(59,130,246,0.40)' }}
            >
              <Code2 className="w-4 h-4 text-white" strokeWidth={1.75} />
            </div>
            <span className="text-sm font-semibold text-white/80 tracking-tight hidden sm:block">PrepTracker</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#64748B' }} strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search questions…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-10 py-2.5 text-sm"
              style={{ borderRadius: '12px', padding: '9px 16px 9px 38px' }}
            />
          </div>

          {/* User + Logout */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}
              >
                {currentUser.username[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: '#CBD5E1' }}>{currentUser.username}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-sm btn-danger flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <div className="z-content relative max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Page heading */}
        <div className="mb-10 animate-fade-up">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.22)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold text-blue-400 tracking-wide uppercase">SDE Interview Prep</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gradient-hero leading-tight mb-3">
            Your Coding<br className="sm:hidden" /> Progress
          </h1>
          <p className="text-base" style={{ color: '#94A3B8' }}>
            Track problems, plan daily todos, and review your activity over time.
          </p>
        </div>

        {/* ── MAIN TABS ──────────────────────────────────────────── */}
        <div className="main-tabs mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('problems')}
            className={`main-tab ${activeTab === 'problems' ? 'main-tab--active' : ''}`}
          >
            <Code2 className="w-4 h-4" strokeWidth={1.75} />
            Problems
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('todos')}
            className={`main-tab ${activeTab === 'todos' ? 'main-tab--active' : ''}`}
          >
            <ListTodo className="w-4 h-4" strokeWidth={1.75} />
            Daily Todo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`main-tab ${activeTab === 'analytics' ? 'main-tab--active' : ''}`}
          >
            <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
            Analytics
          </button>
        </div>

        {activeTab === 'todos' && currentUser && (
          <DailyTodoPanel
            todos={dailyTodos}
            onTodosChange={handleTodosChange}
            userId={currentUser.id}
            questions={questions}
          />
        )}

        {activeTab === 'analytics' && (
          <StatsDashboard
            completionEvents={completionEvents}
            dailyTodos={dailyTodos}
            reviseCount={stats.revise}
          />
        )}

        {activeTab === 'problems' && (
          <>
        {/* ── STAT CARDS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {statCards.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
            <div key={label} className="stat-card">
              <div className="stat-card-icon" style={{ background: iconBg }}>
                <Icon className="w-5 h-5" style={{ color: iconColor }} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#64748B' }}>{label}</p>
                <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: valueColor }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── PROGRESS BAR ───────────────────────────────────────── */}
        <div className="glass-panel p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.22)' }}
              >
                <BarChart3 className="w-4 h-4" style={{ color: '#60A5FA' }} strokeWidth={1.75} />
              </div>
              <span className="font-semibold" style={{ color: '#FFFFFF' }}>Overall Progress</span>
            </div>
            <span className="text-sm tabular-nums" style={{ color: '#64748B' }}>
              {stats.completed} / {stats.total} completed
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${stats.progress}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs" style={{ color: '#475569' }}>
            <span>0%</span>
            <span className="font-semibold" style={{ color: '#60A5FA' }}>{stats.progress}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* ── FILTERS ────────────────────────────────────────────── */}
        <div className="glass-panel p-5 mb-8">
          <div className="flex flex-col gap-4">

            {/* Row 1 — Status + count */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
                <Search className="w-4 h-4" strokeWidth={1.75} />
                <span>
                  Showing <strong style={{ color: '#FFFFFF' }}>{filtered.length}</strong> questions
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'done', 'revise'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`filter-pill capitalize ${filterStatus === s ? `active-${s}` : ''}`}
                  >
                    {s === 'all' ? 'All Status' : s === 'done' ? '✓ Done' : '↺ Revise'}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="divider" />

            {/* Row 2 — Difficulty */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
                Difficulty
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterDifficulty('all')}
                  className={`filter-pill ${filterDifficulty === 'all' ? 'active-all' : ''}`}
                >
                  All Levels
                </button>
                <button
                  onClick={() => setFilterDifficulty('Easy')}
                  className={`filter-pill ${filterDifficulty === 'Easy' ? 'active-difficulty-easy' : ''}`}
                >
                  🟢 Easy
                </button>
                <button
                  onClick={() => setFilterDifficulty('Medium')}
                  className={`filter-pill ${filterDifficulty === 'Medium' ? 'active-difficulty-medium' : ''}`}
                >
                  🟡 Medium
                </button>
                <button
                  onClick={() => setFilterDifficulty('Hard')}
                  className={`filter-pill ${filterDifficulty === 'Hard' ? 'active-difficulty-hard' : ''}`}
                >
                  🔴 Hard
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ── QUESTION SECTIONS ──────────────────────────────────── */}
        {isLoadingData ? (
          <div className="glass-card flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
            <div className="spinner" />
            <p style={{ color: '#94A3B8' }}>Loading your progress…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <Search className="w-7 h-7" style={{ color: '#64748B' }} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>No questions found</p>
              <p className="text-sm" style={{ color: '#64748B' }}>Try a different search term or filter.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {phases.map(({ label, questions: phaseQs, color, glow, dotColor }) => {
              if (phaseQs.length === 0) return null;
              const done = phaseQs.filter((q) => q.status === 'done').length;
              const pct = Math.round((done / phaseQs.length) * 100);
              const collapsed = collapsedPhases.has(label);

              return (
                <section key={label}>
                  {/* Phase header */}
                  <button
                    onClick={() => togglePhase(label)}
                    className="w-full flex items-center justify-between mb-6 group"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: dotColor, boxShadow: `0 0 10px ${glow}` }}
                      />
                      <h2 className="text-lg font-bold" style={{ color }}>
                        {label} Problems
                      </h2>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.10)',
                          color: '#94A3B8',
                        }}
                      >
                        {done}/{phaseQs.length} · {pct}%
                      </span>
                    </div>
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      {collapsed
                        ? <ChevronDown className="w-4 h-4 text-white" strokeWidth={2} />
                        : <ChevronUp className="w-4 h-4 text-white" strokeWidth={2} />
                      }
                    </div>
                  </button>

                  {/* Mini progress */}
                  {!collapsed && (
                    <div className="mb-5 progress-track" style={{ height: '4px' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${dotColor}, ${color})`,
                          boxShadow: `0 0 8px ${glow}`,
                        }}
                      />
                    </div>
                  )}

                  {!collapsed && (
                    <VirtualQuestionGrid
                      questions={phaseQs}
                      onStatusChange={handleStatusChange}
                      onNotesChange={handleNotesChange}
                    />
                  )}
                </section>
              );
            })}
          </div>
        )}
          </>
        )}

        <div className="h-16" />
      </div>
    </main>
  );
}
