'use client';

import { useState, useEffect } from 'react';
import { Question, initializeQuestions } from '@/lib/questions';
import { QuestionCard } from './question-card';
import { Button } from '@/components/ui/button';
import { BarChart3, Search } from 'lucide-react';

type FilterType = 'all' | 'todo' | 'done' | 'revise';

export function Dashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedQuestions = localStorage.getItem('questions');
    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions));
    } else {
      setQuestions(initializeQuestions());
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever questions change
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem('questions', JSON.stringify(questions));
    }
  }, [questions]);

  const handleStatusChange = (id: string, status: Question['status']) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status } : q))
    );
  };

  const handleNotesChange = (id: string, notes: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, notes } : q))
    );
  };

  const getFilteredQuestions = () => {
    let filtered = questions;

    if (filter !== 'all') {
      filtered = filtered.filter((q) => q.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.number.toString().includes(searchTerm)
      );
    }

    return filtered;
  };

  const filteredQuestions = getFilteredQuestions();

  const stats = {
    total: questions.length,
    done: questions.filter((q) => q.status === 'done').length,
    todo: questions.filter((q) => q.status === 'todo').length,
    revise: questions.filter((q) => q.status === 'revise').length,
  };

  const progressPercentage = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative z-10">
        {/* Background orbs */}
        <div className="glow-orb w-96 h-96 bg-purple-600/20 top-1/4 -left-32" />
        <div className="glow-orb w-80 h-80 bg-indigo-600/20 bottom-1/4 -right-24" />
        <div className="text-center">
          <div className="glass-spinner w-12 h-12 mx-auto mb-4" />
          <p className="text-white/60 text-sm tracking-wide">Loading questions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient glow orbs */}
      <div className="glow-orb w-[500px] h-[500px] bg-purple-700/25 -top-32 -left-48" />
      <div className="glow-orb w-[400px] h-[400px] bg-indigo-700/20 top-1/3 -right-32" />
      <div className="glow-orb w-[350px] h-[350px] bg-violet-600/15 bottom-1/4 left-1/3" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass text-purple-300 text-xs font-semibold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            Interview Prep Tracker
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent mb-3 leading-tight">
            SDE Interview Prep
          </h1>
          <p className="text-white/50 text-lg">
            Track your progress through coding problems
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {/* Total */}
          <div className="glass-card rounded-2xl p-5">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Total</div>
            <div className="text-4xl font-bold text-white stat-number">{stats.total}</div>
          </div>

          {/* Completed */}
          <div className="glass-card rounded-2xl p-5">
            <div className="text-xs font-semibold text-emerald-400/70 uppercase tracking-widest mb-3">Completed</div>
            <div className="text-4xl font-bold text-emerald-400 stat-number">{stats.done}</div>
          </div>

          {/* To Do */}
          <div className="glass-card rounded-2xl p-5">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">To Do</div>
            <div className="text-4xl font-bold text-white/80 stat-number">{stats.todo}</div>
          </div>

          {/* Revise */}
          <div className="glass-card rounded-2xl p-5">
            <div className="text-xs font-semibold text-amber-400/70 uppercase tracking-widest mb-3">Revise</div>
            <div className="text-4xl font-bold text-amber-400 stat-number">{stats.revise}</div>
          </div>

          {/* Progress % */}
          <div className="glass-card rounded-2xl p-5">
            <div className="text-xs font-semibold text-purple-400/70 uppercase tracking-widest mb-3">Progress</div>
            <div className="text-4xl font-bold text-purple-400 stat-number">{Math.round(progressPercentage)}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg glass flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <span className="font-semibold text-white/85">Overall Progress</span>
            </div>
            <span className="text-sm text-white/40 tabular-nums">
              {stats.done} of {stats.total} completed
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/8">
            <div
              className="h-full rounded-full transition-all duration-700 progress-glow"
              style={{
                width: `${progressPercentage}%`,
                background: 'linear-gradient(90deg, #7c3aed, #6366f1, #8b5cf6)',
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/30">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass-card rounded-2xl p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search by question title or number…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === 'all'
                    ? 'glass-btn-primary'
                    : 'glass-btn-outline'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('done')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === 'done'
                    ? 'bg-emerald-500/70 backdrop-blur border border-emerald-400/30 text-white shadow-lg shadow-emerald-500/20'
                    : 'glass-btn-outline'
                }`}
              >
                Done
              </button>
              <button
                onClick={() => setFilter('revise')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === 'revise'
                    ? 'bg-amber-500/70 backdrop-blur border border-amber-400/30 text-white shadow-lg shadow-amber-500/20'
                    : 'glass-btn-outline'
                }`}
              >
                Revise
              </button>
            </div>
          </div>
        </div>

        {/* Questions Grid */}
        <div className="space-y-8 mb-8">
          {filteredQuestions.length === 0 ? (
            <div className="glass-card rounded-2xl text-center py-16">
              <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/40 text-sm">No questions found matching your criteria.</p>
            </div>
          ) : (
            <>
              {['Easy', 'Medium', 'Hard'].map((phase) => {
                const phaseQuestions = filteredQuestions.filter((q) => q.phase === phase);
                if (phaseQuestions.length === 0) return null;

                const phaseStats = {
                  total: phaseQuestions.length,
                  done: phaseQuestions.filter((q) => q.status === 'done').length,
                };

                const phaseColor: Record<string, string> = {
                  Easy: 'text-emerald-400',
                  Medium: 'text-amber-400',
                  Hard: 'text-red-400',
                };

                const phaseDotColor: Record<string, string> = {
                  Easy: 'bg-emerald-400',
                  Medium: 'bg-amber-400',
                  Hard: 'bg-red-400',
                };

                return (
                  <div key={phase}>
                    <div className="flex items-center justify-between mb-4 px-1">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${phaseDotColor[phase]}`} />
                        <h2 className={`text-lg font-bold ${phaseColor[phase]}`}>
                          {phase} Problems
                        </h2>
                      </div>
                      <span className="text-xs text-white/35 tabular-nums bg-white/5 px-2.5 py-1 rounded-full border border-white/8">
                        {phaseStats.done}/{phaseStats.total}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {phaseQuestions.map((question) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          onStatusChange={handleStatusChange}
                          onNotesChange={handleNotesChange}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
