import { gtag } from 'gtag';

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID not found');
    return;
  }

  gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

export const trackPageView = (url: string, title?: string) => {
  if (!GA_MEASUREMENT_ID) return;
  
  gtag('config', GA_MEASUREMENT_ID, {
    page_title: title || document.title,
    page_location: url,
  });
};

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (!GA_MEASUREMENT_ID) return;
  
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

export const trackUserAction = {
  login: () => trackEvent('login', 'auth'),
  register: () => trackEvent('register', 'auth'),
  logout: () => trackEvent('logout', 'auth'),
  createAccount: () => trackEvent('create_account', 'accounts'),
  addTransaction: () => trackEvent('add_transaction', 'transactions'),
  importTransactions: () => trackEvent('import_transactions', 'transactions'),
  shareAccount: () => trackEvent('share_account', 'accounts'),
  viewDashboard: () => trackEvent('view_dashboard', 'navigation'),
  viewStatistics: () => trackEvent('view_statistics', 'navigation'),
};