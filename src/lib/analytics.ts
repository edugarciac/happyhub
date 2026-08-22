import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export function pageview(url: string) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
}

export function event(action: string, params?: Record<string, any>) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('event', action, params);
}

const SCROLL_THRESHOLDS = [25, 50, 75, 100];

export function useScrollDepthTracking() {
  const router = useRouter();
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    fired.current = new Set();
  }, [router.asPath]);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const percent = (scrollTop / docHeight) * 100;

      for (const threshold of SCROLL_THRESHOLDS) {
        if (percent >= threshold && !fired.current.has(threshold)) {
          fired.current.add(threshold);
          event('scroll_depth', { percent: threshold, page_path: router.asPath });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router.asPath]);
}

export function useSectionView(sectionName: string) {
  const ref = useRef<HTMLElement | null>(null);
  const hasFired = useRef(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !ref.current || hasFired.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasFired.current) {
            hasFired.current = true;
            event('section_view', { section_name: sectionName });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [sectionName]);

  return ref;
}
