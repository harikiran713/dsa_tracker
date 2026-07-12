'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { initializeQuestions, mixQuestionsByDifficulty, Question } from '@/lib/questions';
import { LoginScreen } from './login-screen';
import { VirtualQuestionGrid } from './virtual-question-grid';
import { DailyTodoPanel } from './daily-todo-panel';
import { DayTrackerPanel, DayTrackerSyncStatus } from './day-tracker-panel';
import { StatsDashboard } from './stats-dashboard';
import { LeaderboardPanel } from './leaderboard-panel';
import {
  getOrCreateUser,
  getUserProgressLocal,
  syncUserProgressFromDb,
  updateQuestionProgress,
  syncCompletionEventsToSupabase,
  syncDailyTodosToSupabase,
  loadDailyTodosFromDb,
  isOnlineUser,
  loadDayTrackerFromDb,
  syncDayTrackerToDb,
  loadDayTracker,
  emptyDayTracker,
  DayTrackerData,
} from '@/lib/db-service';
import { User, UserProgress } from '@/lib/types';
import {
  CompletionEvent,
  DailyTodoItem,
  loadCompletionEvents,
  loadDailyTodos,
  saveCompletionEvents,
  saveDailyTodos,
  dedupeCompletionEvents,
  completionEventId,
} from '@/lib/activity';
import { saveDayTracker } from '@/lib/day-tracker';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useScrollPerformance } from '@/hooks/use-scroll-performance';
import { useDailyTodoReminder } from '@/hooks/use-daily-todo-reminder';
import { DailyTodoReminderToast } from './daily-todo-reminder-toast';
import { getInitialReminderEnabled } from './daily-todo-reminder-controls';
import {
  Search, LogOut, Code2, BarChart3, CheckCircle2,
  AlertCircle, ListTodo, TrendingUp, Trophy, CalendarDays,
} from 'lucide-react';

type FilterStatus     = 'all' | 'done' | 'revise';
type FilterDifficulty = 'all' | 'Easy' | 'Medium' | 'Hard';
type MainTab = 'problems' | 'todos' | 'day100' | 'analytics' | 'leaderboard';

export function DashboardNew() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userProgress, setUserProgress] = useState<Map<number, UserProgress>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('all');
  const [activeTab, setActiveTab] = useState<MainTab>('problems');
  const [completionEvents, setCompletionEvents] = useState<CompletionEvent[]>([]);
  const [dailyTodos, setDailyTodos] = useState<DailyTodoItem[]>([]);
  const [dayTracker, setDayTracker] = useState<DayTrackerData | null>(null);
  const [dayTrackerSync, setDayTrackerSync] = useState<DayTrackerSyncStatus>('idle');
  const [loadedTabs, setLoadedTabs] = useState<Set<MainTab>>(new Set());
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(searchQuery, 180);
  useScrollPerformance();

  useEffect(() => { setQuestions(initializeQuestions()); }, []);

  useEffect(() => {
    const savedUsername = localStorage.getItem('interview_prep_username');
    if (savedUsername) handleLogin(savedUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyProgressToState = (progress: UserProgress[]) => {
    const progressMap = new Map<number, UserProgress>();
    progress.forEach((p) => progressMap.set(p.question_id, p));
    setUserProgress(progressMap);
  };

  const loadProblemsData = async (userId: string) => {
    setIsLoadingData(true);
    try {
      applyProgressToState(getUserProgressLocal(userId));

      const progress = isOnlineUser(userId)
        ? await syncUserProgressFromDb(userId)
        : getUserProgressLocal(userId);
      applyProgressToState(progress);

      let events = dedupeCompletionEvents(loadCompletionEvents(userId));
      if (events.length === 0) {
        const backfill: CompletionEvent[] = progress
          .filter((p) => p.status === 'done')
          .map((p) => ({
            id: completionEventId(userId, p.question_id),
            user_id: userId,
            question_id: p.question_id,
            question_title: p.question_title ?? '',
            question_phase: (p.question_phase ?? 'Easy') as 'Easy' | 'Medium' | 'Hard',
            completed_at: p.updated_at,
          }));
        if (backfill.length > 0) {
          events = dedupeCompletionEvents(backfill);
          saveCompletionEvents(userId, events);
        }
      } else {
        saveCompletionEvents(userId, events);
      }
      setCompletionEvents(events);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadTodosData = async (userId: string) => {
    const todos = isOnlineUser(userId)
      ? await loadDailyTodosFromDb(userId)
      : loadDailyTodos(userId);
    setDailyTodos(todos);
    if (isOnlineUser(userId)) {
      void syncDailyTodosToSupabase(userId, todos);
    }
  };

  const loadDayTrackerData = async (userId: string) => {
    if (!isOnlineUser(userId)) {
      setDayTracker(loadDayTracker(userId));
      setDayTrackerSync('offline');
      return;
    }

    setDayTrackerSync('saving');
    const data = await loadDayTrackerFromDb(userId);
    setDayTracker(data);
    setDayTrackerSync('saved');
  };

  const loadAnalyticsData = async (userId: string) => {
    const events = dedupeCompletionEvents(loadCompletionEvents(userId));
    saveCompletionEvents(userId, events);
    setCompletionEvents(events);
    if (isOnlineUser(userId) && events.length > 0) {
      void syncCompletionEventsToSupabase(userId, events);
    }
  };

  const handleLogin = async (username: string) => {
    setIsLoadingAuth(true);
    try {
      const user = await getOrCreateUser(username);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('interview_prep_username', username);
        setLoadedTabs(new Set(['problems', 'day100']));
        setReminderEnabled(getInitialReminderEnabled(user.id));
        setDailyTodos(loadDailyTodos(user.id));
        setDayTracker(loadDayTracker(user.id));
        await loadProblemsData(user.id);
        void loadTodosData(user.id);
        void loadDayTrackerData(user.id);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    if (activeTab === 'todos' && !loadedTabs.has('todos')) {
      setLoadedTabs((prev) => new Set(prev).add('todos'));
      void loadTodosData(currentUser.id);
    }

    if (activeTab === 'day100' && !loadedTabs.has('day100')) {
      setLoadedTabs((prev) => new Set(prev).add('day100'));
      void loadDayTrackerData(currentUser.id);
    }

    if (activeTab === 'analytics' && !loadedTabs.has('analytics')) {
      setLoadedTabs((prev) => new Set(prev).add('analytics'));
      void loadAnalyticsData(currentUser.id);
    }
  }, [activeTab, currentUser, loadedTabs]);

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
    void syncDailyTodosToSupabase(currentUser.id, todos);
  }, [currentUser]);

  const handleDayTrackerChange = useCallback(async (data: DayTrackerData) => {
    if (!currentUser) return;
    setDayTracker(data);
    saveDayTracker(currentUser.id, data);

    if (!isOnlineUser(currentUser.id)) {
      setDayTrackerSync('offline');
      return;
    }

    setDayTrackerSync('saving');
    const ok = await syncDayTrackerToDb(currentUser.id, data);
    setDayTrackerSync(ok ? 'saved' : 'error');
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
    setDayTracker(null);
    setDayTrackerSync('idle');
    setLoadedTabs(new Set());
    setReminderEnabled(false);
    setReminderToast(null);
    setActiveTab('problems');
    setSearchQuery('');
    setFilterStatus('all');
    setFilterDifficulty('all');
  };

  const showReminderToast = useCallback((message: string) => {
    setReminderToast(message);
    window.setTimeout(() => setReminderToast(null), 8000);
  }, []);

  const openTodosTab = useCallback(() => {
    setActiveTab('todos');
    if (currentUser && !loadedTabs.has('todos')) {
      setLoadedTabs((prev) => new Set(prev).add('todos'));
      void loadTodosData(currentUser.id);
    }
  }, [currentUser, loadedTabs]);

  const { runReminder } = useDailyTodoReminder({
    userId: currentUser?.id ?? null,
    enabled: reminderEnabled,
    onToast: showReminderToast,
    onNavigateTodos: openTodosTab,
  });

  const handleTestReminder = useCallback(() => {
    void runReminder(true);
  }, [runReminder]);

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

  const mixedFiltered = useMemo(
    () => mixQuestionsByDifficulty(filtered),
    [filtered]
  );

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
            onClick={() => setActiveTab('day100')}
            className={`main-tab ${activeTab === 'day100' ? 'main-tab--active' : ''}`}
          >
            <CalendarDays className="w-4 h-4" strokeWidth={1.75} />
            100 Days
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`main-tab ${activeTab === 'analytics' ? 'main-tab--active' : ''}`}
          >
            <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
            Analytics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`main-tab ${activeTab === 'leaderboard' ? 'main-tab--active' : ''}`}
          >
            <Trophy className="w-4 h-4" strokeWidth={1.75} />
            Leaderboard
          </button>
        </div>

        {activeTab === 'leaderboard' && currentUser && (
          <LeaderboardPanel currentUserId={currentUser.id} />
        )}

        {activeTab === 'todos' && currentUser && (
          <DailyTodoPanel
            todos={dailyTodos}
            onTodosChange={handleTodosChange}
            userId={currentUser.id}
            questions={questions}
            reminderEnabled={reminderEnabled}
            onReminderEnabledChange={setReminderEnabled}
            onTestReminder={handleTestReminder}
          />
        )}

        {activeTab === 'day100' && currentUser && (
          <DayTrackerPanel
            data={dayTracker ?? emptyDayTracker(currentUser.id)}
            onChange={handleDayTrackerChange}
            syncStatus={dayTrackerSync}
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
                  Showing <strong style={{ color: '#FFFFFF' }}>{mixedFiltered.length}</strong> questions
                  {filterDifficulty === 'all' && (
                    <span style={{ color: '#64748B' }}> · mixed within each level</span>
                  )}
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
        ) : mixedFiltered.length === 0 ? (
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
          <section>
            <VirtualQuestionGrid
              questions={mixedFiltered}
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
            />
          </section>
        )}
          </>
        )}

        <div className="h-16" />
      </div>

      <DailyTodoReminderToast
        message={reminderToast}
        onDismiss={() => setReminderToast(null)}
        onOpenTodos={openTodosTab}
      />
    </main>
  );
}
