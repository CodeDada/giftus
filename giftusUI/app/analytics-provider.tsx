'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeAnalytics, trackPageView } from '@/lib/analytics';

export function AnalyticsProvider() {
  const pathname = usePathname();

  // Initialize analytics on component mount
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Track page views when pathname changes
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
