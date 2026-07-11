import type { ReactNode } from 'react';
import { navigate } from '../lib/router';
import Logo from './Logo';
import { useAuth } from '../lib/auth';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800/60 bg-bg-main/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <button onClick={() => navigate('home')} className="transition hover:opacity-80">
          <Logo />
        </button>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => navigate('dashboard')}
                className="btn-ghost !px-3 !py-2"
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => signOut()}
                className="btn-ghost !px-3 !py-2"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('login')}
                className="btn-ghost !px-4 !py-2"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate('register')}
                className="btn-primary !px-4 !py-2"
              >
                Get started
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
