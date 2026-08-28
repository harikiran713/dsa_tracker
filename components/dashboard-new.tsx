'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { initializeQuestions, mixQuestionsByDifficulty, Question } from '@/lib/questions';
import { LoginScreen } from './login-screen';
import { VirtualQuestionGrid } from './virtual-question-grid';
import { DailyTodoPanel } from './daily-todo-panel';
import { DayTrackerPanel, DayTrackerSyncStatus } from './day-tracker-panel';
import { LastMinPrepPanel } from './last-min-prep-panel';
import { AdminUsersPanel } from './admin-users-panel';
import { isAdminUsername } from '@/lib/admin';
import { LldPanel } from './lld-panel';
import { StatsDashboard } from './stats-dashboard';
import { LeaderboardPanel } from './leaderboard-panel';
import { ProblemOfTheDayCard } from './problem-of-the-day';
import { ProfilePanel } from './profile-panel';
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
  loadLastMinPrepFromDb,
  syncLastMinPrepToDb,
  purgeLeakedLastMinPrepForUser,
  loadLldFromDb,
  syncLldToDb,
  loadAmazonPrepFromDb,
  syncAmazonPrepToDb,
  loadAmazonTweakFromDb,
  syncAmazonTweakToDb,
  loadGooglePrepFromDb,
  syncGooglePrepToDb,
  loadDesignPrepFromDb,
  syncDesignPrepToDb,
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
import {
  CP_LEARNING_CATEGORIES,
  LastMinPrepProgress,
  loadLastMinPrepProgress,
  saveLastMinPrepProgress,
} from '@/lib/last-min-prep';
import {
  LldProgress,
  loadLldProgress,
  saveLldProgress,
} from '@/lib/lld';
import {
  AMAZON_PREP_CATEGORIES,
  AmazonPrepProgress,
  getAllAmazonPrepQuestions,
  loadAmazonPrepProgress,
  saveAmazonPrepProgress,
} from '@/lib/amazon-prep';
import {
  AMAZON_TWEAK_CATEGORIES,
  AmazonTweakProgress,
  getAllAmazonTweakQuestions,
  loadAmazonTweakProgress,
  saveAmazonTweakProgress,
} from '@/lib/amazon-tweak';
import {
  GOOGLE_PREP_CATEGORIES,
  GooglePrepProgress,
  getAllGooglePrepQuestions,
  loadGooglePrepProgress,
  saveGooglePrepProgress,
} from '@/lib/google-prep';
import {
  DESIGN_PREP_CATEGORIES,
  DesignPrepProgress,
  getAllDesignPrepQuestions,
  loadDesignPrepProgress,
  saveDesignPrepProgress,
} from '@/lib/design-prep';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useScrollPerformance } from '@/hooks/use-scroll-performance';
import { useDailyTodoReminder } from '@/hooks/use-daily-todo-reminder';
import { DailyTodoReminderToast } from './daily-todo-reminder-toast';
import { getInitialReminderEnabled } from './daily-todo-reminder-controls';
import {
  Search, LogOut, Code2, BarChart3, CheckCircle2,
  AlertCircle, ListTodo, TrendingUp, Trophy, CalendarDays, Rocket, Boxes, Cpu, UserRound,
  Menu, X, Circle, Package, PackageSearch, Globe, Layers,
} from 'lucide-react';

type FilterStatus     = 'all' | 'done' | 'revise';
type FilterDifficulty = 'all' | 'Easy' | 'Medium' | 'Hard';
type MainTab = 'problems' | 'todos' | 'day100' | 'lastmin' | 'amazon' | 'amazontweak' | 'google' | 'design' | 'cplearning' | 'lld' | 'profile' | 'analytics' | 'leaderboard';

const NAV_ITEMS: { id: MainTab; label: string; icon: typeof Code2; title: string; subtitle: string }[] = [
  {
    id: 'problems',
    label: 'Problems',
    icon: Code2,
    title: 'Problems',
    subtitle: 'Track DSA questions by status and difficulty.',
  },
  {
    id: 'todos',
    label: 'Daily Todo',
    icon: ListTodo,
    title: 'Daily Todo',
    subtitle: 'Plan tasks and link problems by number.',
  },
  {
    id: 'day100',
    label: '100 Days',
    icon: CalendarDays,
    title: '100 Days Challenge',
    subtitle: 'Mark each day complete as you finish the work.',
  },
  {
    id: 'lastmin',
    label: 'Last min prep',
    icon: Rocket,
    title: 'Last Min Prep',
    subtitle: 'Must-do patterns with Done / Revise / notes.',
  },
  {
    id: 'amazon',
    label: 'Amazon',
    icon: Package,
    title: 'Amazon Prep',
    subtitle: 'Curated Amazon-tagged interview questions.',
  },
  {
    id: 'amazontweak',
    label: 'Tweak Amazon',
    icon: PackageSearch,
    title: 'Tweak Amazon Prep',
    subtitle: 'Second batch of curated Amazon-tagged questions.',
  },
  {
    id: 'google',
    label: 'Google',
    icon: Globe,
    title: 'Google Prep',
    subtitle: 'Curated Google-tagged interview questions.',
  },
  {
    id: 'design',
    label: 'Design',
    icon: Layers,
    title: 'Design Questions',
    subtitle: 'Curated design / OOP data-structure questions.',
  },
  {
    id: 'cplearning',
    label: 'CP Learning',
    icon: Cpu,
    title: 'CP Learning',
    subtitle: 'Advanced CP topics — Math through Binary Lifting.',
  },
  {
    id: 'lld',
    label: 'LLD',
    icon: Boxes,
    title: 'Low-Level Design',
    subtitle: 'Interview LLD topics with status and notes.',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserRound,
    title: 'Profile',
    subtitle: 'Your account summary and stats.',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    title: 'Analytics',
    subtitle: 'Completions and todo activity over time.',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    title: 'Leaderboard',
    subtitle: 'Ranked by score — Easy 2 · Medium 4 · Hard 6.',
  },
];

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
  const [lastMinPrep, setLastMinPrep] = useState<LastMinPrepProgress[]>([]);
  const [amazonPrep, setAmazonPrep] = useState<AmazonPrepProgress[]>([]);
  const [amazonTweak, setAmazonTweak] = useState<AmazonTweakProgress[]>([]);
  const [googlePrep, setGooglePrep] = useState<GooglePrepProgress[]>([]);
  const [designPrep, setDesignPrep] = useState<DesignPrepProgress[]>([]);
  const [lldProgress, setLldProgress] = useState<LldProgress[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<Set<MainTab>>(new Set());
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 180);
  useScrollPerformance();

  useEffect(() => { setQuestions(initializeQuestions()); }, []);

  useEffect(() => {
    const savedUsername = localStorage.getItem('interview_prep_username');
    if (savedUsername) handleLogin(savedUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (!mobileNavOpen) {
      document.body.classList.remove('workspace-nav-locked');
      return;
    }
    document.body.classList.add('workspace-nav-locked');
    return () => document.body.classList.remove('workspace-nav-locked');
  }, [mobileNavOpen]);

  const selectTab = useCallback((id: MainTab) => {
    setActiveTab(id);
    setMobileNavOpen(false);
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

  const loadLastMinPrepData = async (userId: string) => {
    const data = isOnlineUser(userId)
      ? await loadLastMinPrepFromDb(userId)
      : loadLastMinPrepProgress(userId);
    setLastMinPrep(data);
  };

  const loadLldData = async (userId: string) => {
    const data = isOnlineUser(userId)
      ? await loadLldFromDb(userId)
      : loadLldProgress(userId);
    setLldProgress(data);
  };

  const loadAmazonPrepData = async (userId: string) => {
    const data = isOnlineUser(userId)
      ? await loadAmazonPrepFromDb(userId)
      : loadAmazonPrepProgress(userId);
    setAmazonPrep(data);
  };

  const loadAmazonTweakData = async (userId: string) => {
    const data = isOnlineUser(userId)
      ? await loadAmazonTweakFromDb(userId)
      : loadAmazonTweakProgress(userId);
    setAmazonTweak(data);
  };

  const loadGooglePrepData = async (userId: string) => {
    const data = isOnlineUser(userId)
      ? await loadGooglePrepFromDb(userId)
      : loadGooglePrepProgress(userId);
    setGooglePrep(data);
  };

  const loadDesignPrepData = async (userId: string) => {
    const data = isOnlineUser(userId)
      ? await loadDesignPrepFromDb(userId)
      : loadDesignPrepProgress(userId);
    setDesignPrep(data);
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

        if (isAdminUsername(username)) {
          setLoadedTabs(new Set());
          return;
        }

        setUserProgress(new Map());
        setCompletionEvents([]);
        setDailyTodos([]);
        setDayTracker(null);
        setLastMinPrep([]);
        setAmazonPrep([]);
        setAmazonTweak([]);
        setGooglePrep([]);
        setDesignPrep([]);
        setLldProgress([]);
        setLoadedTabs(new Set(['problems', 'day100']));
        setReminderEnabled(getInitialReminderEnabled(user.id));
        setDailyTodos(loadDailyTodos(user.id));
        setDayTracker(loadDayTracker(user.id));
        // Never hydrate Last Min Prep from localStorage on login — another
        // account's leaked rows used to show up here. DB load fills it later.
        setLastMinPrep([]);
        await purgeLeakedLastMinPrepForUser(username, user.id);
        setLldProgress(loadLldProgress(user.id));
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

    if (activeTab === 'lastmin' && !loadedTabs.has('lastmin')) {
      setLoadedTabs((prev) => new Set(prev).add('lastmin'));
      void loadLastMinPrepData(currentUser.id);
    }

    if (activeTab === 'amazon' && !loadedTabs.has('amazon')) {
      setLoadedTabs((prev) => new Set(prev).add('amazon'));
      void loadAmazonPrepData(currentUser.id);
    }

    if (activeTab === 'amazontweak' && !loadedTabs.has('amazontweak')) {
      setLoadedTabs((prev) => new Set(prev).add('amazontweak'));
      void loadAmazonTweakData(currentUser.id);
    }

    if (activeTab === 'google' && !loadedTabs.has('google')) {
      setLoadedTabs((prev) => new Set(prev).add('google'));
      void loadGooglePrepData(currentUser.id);
    }

    if (activeTab === 'design' && !loadedTabs.has('design')) {
      setLoadedTabs((prev) => new Set(prev).add('design'));
      void loadDesignPrepData(currentUser.id);
    }

    if (activeTab === 'cplearning' && !loadedTabs.has('cplearning')) {
      const needsPrepLoad = !loadedTabs.has('lastmin');
      setLoadedTabs((prev) => {
        const next = new Set(prev).add('cplearning');
        if (needsPrepLoad) next.add('lastmin');
        return next;
      });
      if (needsPrepLoad) void loadLastMinPrepData(currentUser.id);
    }

    if (activeTab === 'lld' && !loadedTabs.has('lld')) {
      setLoadedTabs((prev) => new Set(prev).add('lld'));
      void loadLldData(currentUser.id);
    }

    if (
      (activeTab === 'analytics' || activeTab === 'profile') &&
      !loadedTabs.has('analytics')
    ) {
      setLoadedTabs((prev) => new Set(prev).add('analytics').add('profile'));
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

  const handleLastMinPrepChange = useCallback((rows: LastMinPrepProgress[]) => {
    if (!currentUser) return;
    setLastMinPrep(rows);
    saveLastMinPrepProgress(currentUser.id, rows);
    void syncLastMinPrepToDb(currentUser.id, rows);
  }, [currentUser]);

  const handleLldChange = useCallback((rows: LldProgress[]) => {
    if (!currentUser) return;
    setLldProgress(rows);
    saveLldProgress(currentUser.id, rows);
    void syncLldToDb(currentUser.id, rows);
  }, [currentUser]);

  const handleAmazonPrepChange = useCallback((rows: AmazonPrepProgress[]) => {
    if (!currentUser) return;
    setAmazonPrep(rows);
    saveAmazonPrepProgress(currentUser.id, rows);
    void syncAmazonPrepToDb(currentUser.id, rows);
  }, [currentUser]);

  const handleAmazonTweakChange = useCallback((rows: AmazonTweakProgress[]) => {
    if (!currentUser) return;
    setAmazonTweak(rows);
    saveAmazonTweakProgress(currentUser.id, rows);
    void syncAmazonTweakToDb(currentUser.id, rows);
  }, [currentUser]);

  const handleGooglePrepChange = useCallback((rows: GooglePrepProgress[]) => {
    if (!currentUser) return;
    setGooglePrep(rows);
    saveGooglePrepProgress(currentUser.id, rows);
    void syncGooglePrepToDb(currentUser.id, rows);
  }, [currentUser]);

  const handleDesignPrepChange = useCallback((rows: DesignPrepProgress[]) => {
    if (!currentUser) return;
    setDesignPrep(rows);
    saveDesignPrepProgress(currentUser.id, rows);
    void syncDesignPrepToDb(currentUser.id, rows);
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
    localStorage.removeItem('interview_prep_user_id');
    sessionStorage.removeItem('admin_pin_verified');
    setUserProgress(new Map());
    setCompletionEvents([]);
    setDailyTodos([]);
    setDayTracker(null);
    setDayTrackerSync('idle');
    setLastMinPrep([]);
    setAmazonPrep([]);
    setAmazonTweak([]);
    setGooglePrep([]);
    setDesignPrep([]);
    setLldProgress([]);
    setLoadedTabs(new Set());
    setReminderEnabled(false);
    setReminderToast(null);
    setActiveTab('problems');
    setSearchQuery('');
    setFilterStatus('all');
    setFilterDifficulty('all');
    setMobileNavOpen(false);
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

  const handleViewPotdInProblems = useCallback((question: Question) => {
    setActiveTab('problems');
    setFilterStatus('all');
    setFilterDifficulty('all');
    setSearchQuery(question.title);
  }, []);

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

  if (isAdminUsername(currentUser.username)) {
    return <AdminUsersPanel onLogout={handleLogout} />;
  }

  const activeMeta = NAV_ITEMS.find((item) => item.id === activeTab) ?? NAV_ITEMS[0];

  const statCards = [
    {
      label: 'Total',
      value: stats.total,
      icon: ListTodo,
      tone: 'stat-tone--blue',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      tone: 'stat-tone--green',
    },
    {
      label: 'Revise',
      value: stats.revise,
      icon: AlertCircle,
      tone: 'stat-tone--amber',
    },
    {
      label: 'To Do',
      value: stats.toDo,
      icon: Circle,
      tone: 'stat-tone--muted',
    },
    {
      label: 'Progress',
      value: `${stats.progress}%`,
      icon: TrendingUp,
      tone: 'stat-tone--cyan',
    },
  ];

  const navButtons = (
    <>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => selectTab(id)}
          className={`app-nav-item ${activeTab === id ? 'app-nav-item--active' : ''}`}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} />
          <span>{label}</span>
        </button>
      ))}
    </>
  );

  return (
    <main className="app-shell workspace-shell relative min-h-screen">
      <div className="bg-blobs workspace-blobs">
        <div className="blob blob-blue" style={{ width: 560, height: 560, top: '-18%', left: '-14%' }} />
        <div className="blob blob-cyan" style={{ width: 320, height: 320, bottom: '-10%', right: '-8%' }} />
      </div>

      <header className="workspace-topbar glass-header sticky top-0 z-50">
        <div className="workspace-topbar-inner">
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              className="workspace-menu-btn lg:hidden"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
            >
              {mobileNavOpen ? <X className="w-4 h-4" strokeWidth={2} /> : <Menu className="w-4 h-4" strokeWidth={2} />}
            </button>
            <div className="workspace-brand">
              <div className="workspace-brand-mark">
                <Code2 className="w-4 h-4 text-white" strokeWidth={1.75} />
              </div>
              <div className="hidden sm:block">
                <p className="workspace-brand-name">PrepTracker</p>
                <p className="workspace-brand-sub">Workspace</p>
              </div>
            </div>
          </div>

          {activeTab === 'problems' ? (
            <div className="workspace-search">
              <Search className="workspace-search-icon" strokeWidth={1.75} />
              <input
                type="text"
                placeholder="Search questions…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input workspace-search-input"
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="workspace-user-chip">
              <div className="workspace-user-avatar">
                {currentUser.username[0].toUpperCase()}
              </div>
              <span className="hidden md:inline">{currentUser.username}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-sm btn-danger flex items-center gap-1.5">
              <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <button
          type="button"
          className="workspace-nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="workspace-layout z-content">
        <aside className={`workspace-sidebar ${mobileNavOpen ? 'workspace-sidebar--open' : ''}`}>
          <p className="workspace-sidebar-label">Navigate</p>
          <nav className="app-nav app-nav--sidebar" aria-label="Main">
            {navButtons}
          </nav>
        </aside>

        <div className="workspace-main">
          <header className="workspace-page-header">
            <h1 className="workspace-page-title">{activeMeta.title}</h1>
            <p className="workspace-page-subtitle">{activeMeta.subtitle}</p>
          </header>

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

          {activeTab === 'lastmin' && currentUser && (
            <LastMinPrepPanel
              userId={currentUser.id}
              progress={lastMinPrep}
              onProgressChange={handleLastMinPrepChange}
            />
          )}

          {activeTab === 'amazon' && currentUser && (
            <LastMinPrepPanel
              userId={currentUser.id}
              progress={amazonPrep}
              onProgressChange={handleAmazonPrepChange}
              categories={AMAZON_PREP_CATEGORIES}
              title="Amazon Prep"
              description={`${getAllAmazonPrepQuestions().length} curated Amazon-tagged questions. Track Done / Revise / notes.`}
              accent="#F59E0B"
              icon={<Package className="w-5 h-5" style={{ color: '#F59E0B' }} strokeWidth={1.75} />}
              showTags={false}
            />
          )}

          {activeTab === 'amazontweak' && currentUser && (
            <LastMinPrepPanel
              userId={currentUser.id}
              progress={amazonTweak}
              onProgressChange={handleAmazonTweakChange}
              categories={AMAZON_TWEAK_CATEGORIES}
              title="Tweak Amazon Prep"
              description={`${getAllAmazonTweakQuestions().length} curated Amazon-tagged questions (batch 2). Track Done / Revise / notes.`}
              accent="#8B5CF6"
              icon={<PackageSearch className="w-5 h-5" style={{ color: '#8B5CF6' }} strokeWidth={1.75} />}
              showTags={false}
            />
          )}

          {activeTab === 'google' && currentUser && (
            <LastMinPrepPanel
              userId={currentUser.id}
              progress={googlePrep}
              onProgressChange={handleGooglePrepChange}
              categories={GOOGLE_PREP_CATEGORIES}
              title="Google Prep"
              description={`${getAllGooglePrepQuestions().length} curated Google-tagged questions. Track Done / Revise / notes.`}
              accent="#4285F4"
              icon={<Globe className="w-5 h-5" style={{ color: '#4285F4' }} strokeWidth={1.75} />}
              showTags={false}
            />
          )}

          {activeTab === 'design' && currentUser && (
            <LastMinPrepPanel
              userId={currentUser.id}
              progress={designPrep}
              onProgressChange={handleDesignPrepChange}
              categories={DESIGN_PREP_CATEGORIES}
              title="Design Questions"
              description={`${getAllDesignPrepQuestions().length} curated design / OOP data-structure questions. Track Done / Revise / notes.`}
              accent="#22D3EE"
              icon={<Layers className="w-5 h-5" style={{ color: '#22D3EE' }} strokeWidth={1.75} />}
              showTags={false}
            />
          )}

          {activeTab === 'cplearning' && currentUser && (
            <LastMinPrepPanel
              userId={currentUser.id}
              progress={lastMinPrep}
              onProgressChange={handleLastMinPrepChange}
              categories={CP_LEARNING_CATEGORIES}
              title="CP Learning"
              description={`${CP_LEARNING_CATEGORIES.length} advanced CP topics — Math through Binary Lifting. Track Done / Revise / notes.`}
              accent="#38BDF8"
              icon={<Cpu className="w-5 h-5" style={{ color: '#38BDF8' }} strokeWidth={1.75} />}
            />
          )}

          {activeTab === 'lld' && currentUser && (
            <LldPanel
              userId={currentUser.id}
              progress={lldProgress}
              onProgressChange={handleLldChange}
            />
          )}

          {activeTab === 'profile' && currentUser && (
            <ProfilePanel
              user={currentUser}
              questions={questionsWithProgress}
              completionEvents={completionEvents}
              dailyTodos={dailyTodos}
              reviseCount={stats.revise}
            />
          )}

          {activeTab === 'analytics' && (
            <StatsDashboard
              completionEvents={completionEvents}
              dailyTodos={dailyTodos}
              reviseCount={stats.revise}
              userId={currentUser.id}
              questions={questionsWithProgress}
            />
          )}

          {activeTab === 'problems' && (
            <>
              <div className="problems-toolbar glass-panel mb-6">
                <div className="problems-stats">
                  {statCards.map(({ label, value, icon: Icon, tone }) => (
                    <div key={label} className={`problems-stat ${tone}`}>
                      <div className="problems-stat-icon">
                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="problems-stat-label">{label}</p>
                        <p className="problems-stat-value">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="problems-progress">
                  <div className="problems-progress-meta">
                    <span>Overall progress</span>
                    <span className="tabular-nums">
                      {stats.completed} / {stats.total} · {stats.progress}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${stats.progress}%` }} />
                  </div>
                </div>

                <div className="problems-filters">
                  <div className="problems-filter-group">
                    <span className="problems-filter-label">Status</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(['all', 'done', 'revise'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFilterStatus(s)}
                          className={`filter-pill capitalize ${filterStatus === s ? `active-${s}` : ''}`}
                        >
                          {s === 'all' ? 'All' : s === 'done' ? 'Done' : 'Revise'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="problems-filter-group">
                    <span className="problems-filter-label">Difficulty</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setFilterDifficulty('all')}
                        className={`filter-pill ${filterDifficulty === 'all' ? 'active-all' : ''}`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterDifficulty('Easy')}
                        className={`filter-pill filter-pill--easy ${filterDifficulty === 'Easy' ? 'active-difficulty-easy' : ''}`}
                      >
                        <span className="diff-dot diff-dot--easy" />
                        Easy
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterDifficulty('Medium')}
                        className={`filter-pill filter-pill--medium ${filterDifficulty === 'Medium' ? 'active-difficulty-medium' : ''}`}
                      >
                        <span className="diff-dot diff-dot--medium" />
                        Medium
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterDifficulty('Hard')}
                        className={`filter-pill filter-pill--hard ${filterDifficulty === 'Hard' ? 'active-difficulty-hard' : ''}`}
                      >
                        <span className="diff-dot diff-dot--hard" />
                        Hard
                      </button>
                    </div>
                  </div>

                  <p className="problems-count">
                    Showing <strong>{mixedFiltered.length}</strong> questions
                    {filterDifficulty === 'all' && <span> · mixed within each level</span>}
                  </p>
                </div>
              </div>

              {isLoadingData ? (
                <div className="glass-card flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
                  <div className="spinner" />
                  <p className="text-muted-ui">Loading your progress…</p>
                </div>
              ) : mixedFiltered.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
                  <div className="empty-icon">
                    <Search className="w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold mb-1 text-white">No questions found</p>
                    <p className="text-sm text-muted-ui">Try a different search term or filter.</p>
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

          <div className="h-12" />
        </div>
      </div>

      <DailyTodoReminderToast
        message={reminderToast}
        onDismiss={() => setReminderToast(null)}
        onOpenTodos={openTodosTab}
      />
    </main>
  );
}
