'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { Question } from '@/lib/questions';
import { QuestionCard } from './question-card';

const ROW_HEIGHT = 188;
const ROW_GAP = 24;

interface VirtualQuestionGridProps {
  questions: Question[];
  onStatusChange: (id: string, status: Question['status']) => void;
  onNotesChange: (id: string, notes: string) => void;
}

export function VirtualQuestionGrid({
  questions,
  onStatusChange,
  onNotesChange,
}: VirtualQuestionGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const rowCount = Math.ceil(questions.length / 2);

  useLayoutEffect(() => {
    const updateMargin = () => {
      setScrollMargin(containerRef.current?.offsetTop ?? 0);
    };

    updateMargin();
    window.addEventListener('resize', updateMargin, { passive: true });
    return () => window.removeEventListener('resize', updateMargin);
  }, [questions.length]);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ROW_HEIGHT + ROW_GAP,
    overscan: 8,
    scrollMargin,
  });

  if (questions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="virtual-question-grid"
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const left = questions[virtualRow.index * 2];
        const right = questions[virtualRow.index * 2 + 1];

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="virtual-question-row"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start - scrollMargin}px)`,
            }}
          >
            <div className="question-grid">
              {left && (
                <QuestionCard
                  question={left}
                  onStatusChange={onStatusChange}
                  onNotesChange={onNotesChange}
                />
              )}
              {right && (
                <QuestionCard
                  question={right}
                  onStatusChange={onStatusChange}
                  onNotesChange={onNotesChange}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
