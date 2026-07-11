import { useEffect, useState, useCallback } from 'react';

export type RouteName =
  | 'home'
  | 'login'
  | 'register'
  | 'verify-email'
  | 'forgot-password'
  | 'reset-password'
  | 'profile'
  | 'dashboard'
  | 'pricing'
  | 'checkout'
  | 'subscription';

export type Route =
  | { name: 'home' }
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'verify-email' }
  | { name: 'forgot-password' }
  | { name: 'reset-password' }
  | { name: 'profile' }
  | { name: 'dashboard' }
  | { name: 'pricing'; plan?: string }
  | { name: 'checkout'; plan?: string }
  | { name: 'subscription' };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/');
  const seg = parts[0] || 'home';
  const param = parts[1] ?? '';
  switch (seg) {
    case 'login':
      return { name: 'login' };
    case 'register':
      return { name: 'register' };
    case 'verify-email':
      return { name: 'verify-email' };
    case 'forgot-password':
      return { name: 'forgot-password' };
    case 'reset-password':
      return { name: 'reset-password' };
    case 'profile':
      return { name: 'profile' };
    case 'dashboard':
      return { name: 'dashboard' };
    case 'pricing':
      return { name: 'pricing', plan: param || undefined };
    case 'checkout':
      return { name: 'checkout', plan: param || undefined };
    case 'subscription':
      return { name: 'subscription' };
    default:
      return { name: 'home' };
  }
}

export function navigate(name: RouteName, param?: string) {
  window.location.hash = param ? `/${name}/${param}` : `/${name}`;
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback((name: RouteName) => {
    navigate(name);
  }, []);

  return { route, go };
}
