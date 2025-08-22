import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    const url = window.location.origin + location.pathname + location.search;
    trackPageView(url);
  }, [location]);
};