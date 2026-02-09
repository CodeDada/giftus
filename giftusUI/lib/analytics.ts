// Google Analytics setup for tracking daily users
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const initializeAnalytics = () => {
  // Google Analytics script tag
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-SKRDT6CDV9';
  document.head.appendChild(script);

  // Google Analytics configuration
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', 'G-SKRDT6CDV9', {
    page_path: window.location.pathname,
    anonymize_ip: true,
  });
};

// Track page views
export const trackPageView = (path: string) => {
  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('config', 'G-SKRDT6CDV9', {
      page_path: path,
    });
  }
};

// Track events
export const trackEvent = (eventName: string, eventData: Record<string, any>) => {
  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('event', eventName, eventData);
  }
};
