import { useState, useEffect, type ReactNode } from 'react';
import { Menu, LogOut, User as UserIcon, Crown, Coins, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { navigate } from '../../lib/router';
import Logo from '../Logo';
import { isVip, getPlanConfig, msUntilNextResetUTC, formatCountdown } from '../../lib/coins';

export type TabId = 'enhance' | 'queue' | 'download' | 'history';

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'enhance', label: 'Enhance', emoji: '✨' },
  { id: 'queue', label: 'Queue', emoji: '⏳' },
  { id: 'download', label: 'Download', emoji: '⬇️' },
  { id: 'history', label: 'History', emoji: '🕐' },
];

export default function DashboardLayout({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}) {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countdown, setCountdown] = useState(msUntilNextResetUTC());

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(msUntilNextResetUTC());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const vip = isVip(profile?.plan ?? 'free');
  const planCfg = getPlanConfig(profile?.plan ?? 'free');

  return (
    <div className="flex min-h-screen flex-col bg-bg-main">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-gray-800/60 bg-[#0d1526]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Left: hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-ink-secondary transition hover:bg-bg-hover hover:text-ink-primary"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button onClick={() => navigate('home')} className="transition hover:opacity-80">
              <Logo size={28} />
            </button>
          </div>

          {/* Center: email dropdown (hidden on mobile) */}
          <div className="hidden sm:block">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-secondary transition hover:bg-bg-hover"
              >
                <span className="max-w-[200px] truncate">{user?.email}</span>
                <span className="text-xs text-ink-muted">▾</span>
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="card-panel absolute right-0 top-full z-20 mt-2 w-48 p-2">
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('profile'); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-secondary transition hover:bg-bg-hover"
                    >
                      <UserIcon className="h-4 w-4" /> Profile
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); signOut(); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error transition hover:bg-error/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: coin badge */}
          <div className="flex items-center gap-2">
            {vip && (
              <span className="vip-gradient hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white sm:inline-flex">
                <Crown className="h-3 w-3 text-gold-crown" />
                {planCfg.label}
              </span>
            )}
            <div className="coin-badge flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold">
              <Coins className="h-4 w-4" />
              <span>{(profile?.coins_balance ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Free user countdown */}
        {!vip && (
          <div className="border-t border-gray-800/40 bg-bg-card/50 px-4 py-1.5 text-center">
            <p className="text-xs text-ink-muted">
              Next coin refresh in <span className="font-mono text-gold">{formatCountdown(countdown)}</span>
            </p>
          </div>
        )}
        {vip && profile?.subscription_expires_at && (
          <div className="border-t border-gray-800/40 bg-bg-card/50 px-4 py-1.5 text-center">
            <p className="text-xs text-ink-muted">
              Plan expires on <span className="text-ink-secondary">{new Date(profile.subscription_expires_at).toLocaleDateString()}</span>
            </p>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800/60 bg-[#111827]">
        <div className="mx-auto flex max-w-6xl items-center justify-around">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium transition-all ${
                activeTab === tab.id ? 'tab-active' : 'tab-inactive hover:text-ink-secondary'
              }`}
            >
              <span className="text-lg leading-none">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Side menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] animate-fade-in bg-bg-card p-4 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo size={28} />
              <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-ink-secondary hover:bg-bg-hover">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setMenuOpen(false); navigate('profile'); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-secondary transition hover:bg-bg-hover"
              >
                <UserIcon className="h-4 w-4" /> Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); signOut(); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-error transition hover:bg-error/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
