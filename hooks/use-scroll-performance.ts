'use client';

import { useEffect } from 'react';

export function useScrollPerformance() {
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const onScroll = () => {
      document.documentElement.classList.add('is-scrolling');
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        document.documentElement.classList.remove('is-scrolling');
      }, 120);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timeout) clearTimeout(timeout);
      document.documentElement.classList.remove('is-scrolling');
    };
  }, []);
}
