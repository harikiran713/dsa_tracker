'use client';

import { useEffect, useState } from 'react';
import { NotebookPen, Search } from 'lucide-react';
import {
  NoteSearchHit,
  NoteSearchSource,
  searchNotes,
} from '@/lib/db-service';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface NotesSearchPanelProps {
  userId: string;
}

const SOURCE_LABEL: Record<NoteSearchHit['source'], string> = {
  problems: 'Problems',
  lastmin: 'Last Min / CP',
  lld: 'LLD',
};

export function NotesSearchPanel({ userId }: NotesSearchPanelProps) {
  const [q, setQ] = useState('');
  const [source, setSource] = useState<NoteSearchSource>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NoteSearchHit[]>([]);
  const debounced = useDebouncedValue(q.trim(), 300);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void searchNotes(userId, debounced, source).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res) {
        setError('Search failed (server unavailable).');
        setResults([]);
        return;
      }
      setResults(res.results);
    });

    return () => {
      cancelled = true;
    };
  }, [debounced, source, userId]);

  return (
    <div className="glass-panel p-5 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(96,165,250,0.12)',
            border: '1px solid rgba(96,165,250,0.28)',
          }}
        >
          <NotebookPen className="w-4 h-4" style={{ color: '#60A5FA' }} strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="font-semibold text-white">Notes search</h3>
          <p className="text-xs" style={{ color: '#64748B' }}>
            Server search across your problem, Last Min/CP, and LLD notes
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#64748B' }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes (min 2 chars)…"
            className="glass-input w-full"
            style={{ borderRadius: 12, padding: '10px 14px 10px 36px' }}
          />
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as NoteSearchSource)}
          className="glass-input"
          style={{ borderRadius: 12, padding: '10px 12px', minWidth: 160 }}
        >
          <option value="all">All sources</option>
          <option value="problems">Problems</option>
          <option value="lastmin">Last Min / CP</option>
          <option value="lld">LLD</option>
        </select>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: '#64748B' }}>
          Searching…
        </p>
      )}
      {error && (
        <p className="text-sm" style={{ color: '#FCA5A5' }}>
          {error}
        </p>
      )}
      {!loading && !error && debounced.length >= 2 && results.length === 0 && (
        <p className="text-sm" style={{ color: '#64748B' }}>
          No notes matched “{debounced}”.
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((hit) => (
            <li
              key={`${hit.source}-${hit.ref_id}`}
              className="rounded-xl p-3"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(96,165,250,0.15)', color: '#93C5FD' }}
                >
                  {SOURCE_LABEL[hit.source]}
                </span>
                <span className="text-sm font-medium text-white truncate">{hit.title}</span>
                <span className="text-xs" style={{ color: '#64748B' }}>
                  #{hit.ref_id} · {hit.status}
                </span>
              </div>
              <p className="text-sm" style={{ color: '#CBD5E1' }}>
                {hit.snippet}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
